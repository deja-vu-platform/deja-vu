import * as mongodb from 'mongodb';
import { TaskDoc, TasksInput, CreateTaskInput, UpdateTaskInput } from './schema';
import {
  ClicheServer,
  ClicheServerBuilder,
  Config,
  Context,
  Validation,
  CONCURRENT_UPDATE_ERROR
} from 'cliche-server';

import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

class TaskValidation {
  static async taskExistsOrFail(tasks, id: string): Promise<any> {
    return Validation.existsOrFail(tasks, id, 'Task');
  }
}

function isPendingCreate(task: TaskDoc | null) {
  return _.get(task, 'pending.type') === 'create-task';
}

async function updateTask(tasks, id: string, updateOp: object,
  updateType: 'update-task' | 'claim-task' | 'complete-task' | 'approve-task',
  context: Context): Promise<Boolean> {

  const notPendingTaskFilter = {
    id,
    pending: { $exists: false },
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
              type: updateType,
            },
          },
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
      return false;
    case 'abort':
      await tasks.updateOne(reqIdPendingFilter, { $unset: { pending: '' } });
      return false;
  }
  return false;
}

const taskCliche: ClicheServer = new ClicheServerBuilder('task')
  .initDb((db: mongodb.Db, config: Config) => {
    const tasks: mongodb.Collection<TaskDoc> = db.collection('tasks');
    return tasks.createIndex({ id: 1 }, { unique: true, sparse: true });
  })
  .resolvers((db: mongodb.Db, config: Config) => {
    const tasks: mongodb.Collection<TaskDoc> = db.collection('tasks');
    return {
      Query: {
        tasks: async (root, { input }: { input: TasksInput }) => {
          const filterOp = _.omit(input, ['assigned']);
          if (input.assigned === false) {
            filterOp['assigneeId'] = null;
          }
          filterOp['pending'] = { type: { $ne: 'create-task' } };

          return await tasks.find(filterOp)
            .toArray();
        },
        task: async (root, { id }) => {
          const task: TaskDoc | null = await tasks.findOne({ id: id });
          return isPendingCreate(task) ? null : task;
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
          root, { input }: {input: CreateTaskInput}, context: Context) => {
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
              return;
            case 'abort':
              await tasks.deleteOne(reqIdPendingFilter);
              return;
          }

          return newTask;
        },
        updateTask: async (root, { input }: {input: UpdateTaskInput}, context:Context) => {
          return updateTask(tasks, input.id, { $set: input }, 'update-task', context);
        },
        claimTask: async (root, { id, assigneeId }, context: Context) => {
          return updateTask(tasks,
            id, { $set: { assigneeId: assigneeId } }, 'claim-task', context);
        },
        approveTask: async (root, { id }, context: Context) => {
          return updateTask(tasks,
            id, { $set: { approved: true } }, 'approve-task', context);
        },
        completeTask: async (root, { id }, context: Context) => {
          return updateTask(tasks,
            id, { $set: { completed: true } }, 'complete-task', context);
        }
      }
    };
  })
  .build();

taskCliche.start();
