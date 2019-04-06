import {
  ActionRequestTable,
  ClicheServer,
  ClicheServerBuilder,
  CONCURRENT_UPDATE_ERROR,
  Config,
  Context,
  getReturnFields,
  Validation
} from '@deja-vu/cliche-server';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import { v4 as uuid } from 'uuid';

import {
  CreateTaskInput,
  CreateTasksForAssigneesInput,
  TaskDoc,
  TasksInput,
  UpdateTaskInput
} from './schema';


class TaskValidation {
  static async taskExistsOrFail(
    tasks: mongodb.Collection<TaskDoc>, id: string): Promise<TaskDoc> {
    return Validation.existsOrFail(tasks, id, 'Task');
  }
}

const actionRequestTable: ActionRequestTable = {
  'approve-task': (extraInfo) => `
    mutation ApproveTask($id: ID!) {
      approveTask (id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'claim-task': (extraInfo) => `
    mutation ClaimTask($id: ID!, $assigneeId) {
      claimTask (id: $id, assigneeId: $assigneeId) ${getReturnFields(extraInfo)}
    }
  `,
  'complete-task': (extraInfo) => `
    mutation CompleteTask($id: ID!) {
      completeTask (id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'create-task': (extraInfo) => `
    mutation CreateTask($input: CreateTaskInput!) {
      createTask (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'create-tasks-for-assignees': (extraInfo) => `
    mutation CreateTasksForAssignees($input: CreateTasksForAssigneesInput!) {
      createTasksForAssignees (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-tasks': (extraInfo) => `
    query ShowTasks($input: TasksInput!) {
      tasks(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-task-count': (extraInfo) => `
    query ShowTaskCount($input: TasksInput!) {
      taskCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'update-task': (extraInfo) => {
    switch (extraInfo.action) {
      case 'update':
        return `
          mutation UpdateTask($input: UpdateTaskInput!) {
            updateTask(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'load':
        return `
          query Task($id: ID!) {
            task(id: $id) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  }
};

function isPendingCreate(task: TaskDoc | null) {
  return _.get(task, 'pending.type') === 'create-task';
}

function getTaskFilter(input: TasksInput) {
  const filter = _.omit(input, ['assigned']);
  if (input.assigned === false) {
    filter['assigneeId'] = null;
  }
  filter['pending'] = { $in: [null, { type: { $ne: 'create-task' } }] };

  return filter;
}

async function updateTask(
  tasks: mongodb.Collection<TaskDoc>, id: string, updateOp: object,
  updateType: 'update-task' | 'claim-task' | 'complete-task' | 'approve-task',
  context: Context): Promise<Boolean> {

  const notPendingTaskFilter = {
    id,
    pending: { $exists: false }
  };
  const reqIdPendingFilter = { 'pending.reqId': context.reqId };
  switch (context.reqType) {
    case 'vote':
      await TaskValidation.taskExistsOrFail(tasks, id);
      const pendingUpdateObj = await tasks.updateOne(
        notPendingTaskFilter,
        {
          $set: {
            pending: {
              reqId: context.reqId,
              type: updateType
            }
          }
        });
      if (pendingUpdateObj.matchedCount === 0) {
        throw new Error(CONCURRENT_UPDATE_ERROR);
      }

      return true;
    case undefined:
      await TaskValidation.taskExistsOrFail(tasks, id);
      const updateObj = await tasks.updateOne(notPendingTaskFilter, updateOp);
      if (updateObj.matchedCount === 0) {
        throw new Error(CONCURRENT_UPDATE_ERROR);
      }

      return true;
    case 'commit':
      await tasks.updateOne(
        reqIdPendingFilter,
        { ...updateOp, $unset: { pending: '' } });

      return true;
    case 'abort':
      await tasks.updateOne(reqIdPendingFilter, { $unset: { pending: '' } });

      return true;
  }

  return true;
}

function resolvers(db: mongodb.Db, _config: Config): object {
  const tasks: mongodb.Collection<TaskDoc> = db.collection('tasks');

  return {
    Query: {
      tasks: async (_root, { input }: { input: TasksInput }) => {
        return await tasks.find(getTaskFilter(input))
          .toArray();
      },

      task: async (_root, { id }) => {
        const task: TaskDoc | null = await tasks.findOne({ id: id });

        return isPendingCreate(task) ? null : task;
      },

      taskCount: (_root, { input }: { input: TasksInput }) => {
        return tasks.count(getTaskFilter(input));
      }
    },
    Task: {
      id: (task: TaskDoc) => task.id,
      assignerId: (task: TaskDoc) => task.assignerId,
      assigneeId: (task: TaskDoc) => task.assigneeId,
      dueDate: (task: TaskDoc) => task.dueDate
    },
    Mutation: {
      createTask: async (
        _root, { input }: { input: CreateTaskInput }, context: Context) => {
        const newTask: TaskDoc = {
          id: input.id ? input.id : uuid(),
          assignerId: input.assignerId,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate,
          completed: false,
          approved: false
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };
        switch (context.reqType) {
          case 'vote':
            newTask.pending = { reqId: context.reqId, type: 'create-task' };
          case undefined:
            await tasks.insertOne(newTask);

            return newTask;
          case 'commit':
            await tasks.updateOne(
              reqIdPendingFilter,
              { $unset: { pending: '' } });

            return newTask;
          case 'abort':
            await tasks.deleteOne(reqIdPendingFilter);

            return newTask;
        }

        return newTask;
      },
      createTasksForAssignees: async (
        _root, { input }: { input: CreateTasksForAssigneesInput },
        context: Context) => {
        let newTasks: TaskDoc[] = _.map(input.assigneeIds, (assigneeId) => {
          return {
            id: uuid(),
            assignerId: input.assignerId,
            assigneeId: assigneeId,
            dueDate: input.dueDate,
            completed: false,
            approved: false
          };
        });

        const reqIdPendingFilter = { 'pending.reqId': context.reqId };
        switch (context.reqType) {
          case 'vote':
            newTasks = _.map(newTasks, (task) => {
              _.set(task, 'pending', {
                reqId: context.reqId, type: 'create-task'
              });

              return task;
            });

          case undefined:
            await tasks.insertMany(newTasks);

            return newTasks;
          case 'commit':
            await tasks.updateMany(
              reqIdPendingFilter,
              { $unset: { pending: '' } });

            return newTasks;
          case 'abort':
            await tasks.deleteMany(reqIdPendingFilter);

            return newTasks;
        }

        return newTasks;
      },
      updateTask: async (
        _root, { input }: { input: UpdateTaskInput }, context: Context) => {
        return updateTask(
          tasks, input.id, { $set: input }, 'update-task', context);
      },
      claimTask: async (_root, { id, assigneeId }, context: Context) => {
        return updateTask(tasks,
          id, { $set: { assigneeId: assigneeId } }, 'claim-task', context);
      },
      approveTask: async (_root, { id }, context: Context) => {
        return updateTask(tasks,
          id, { $set: { approved: true } }, 'approve-task', context);
      },
      completeTask: async (_root, { id }, context: Context) => {
        return updateTask(tasks,
          id, { $set: { completed: true } }, 'complete-task', context);
      }
    }
  };
}

const taskCliche: ClicheServer = new ClicheServerBuilder('task')
  .initDb((db: mongodb.Db, _config: Config): Promise<any> => {
    const tasks: mongodb.Collection<TaskDoc> = db.collection('tasks');

    return tasks.createIndex({ id: 1 }, { unique: true, sparse: true });
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

taskCliche.start();
