import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import { makeExecutableSchema } from 'graphql-tools';
import * as _ from 'lodash';

// GitHub Issue: https://github.com/apollographql/apollo-server/issues/927
// tslint:disable-next-line:no-var-requires
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');


interface TaskDoc {
  id: string;
  assignerId: string;
  assigneeId: string;
  dueDate: string;
  completed: boolean;
  approved: boolean;
  pending?: PendingDoc;
}

interface PendingDoc {
  reqId: string;
  type: 'create-task' | 'update-task' | 'claim-task' | 'complete-task' |
    'approve-task';
}

interface TasksInput {
  assigneeId?: string;
  assignerId?: string;
  approved?: boolean;
  assigned?: boolean;
  completed?: boolean;
}

interface CreateTaskInput {
  id: string;
  assignerId: string;
  assigneeId: string;
  dueDate: string;
}

interface UpdateTaskInput {
  id: string;
  assignerId: string | undefined;
  assigneeId: string | undefined;
  dueDate: string | undefined;
}


interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
}

const CONCURRENT_UPDATE_ERROR = 'An error has occured. Please try again later';

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'task';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  reinitDbOnStartup: true
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = {...DEFAULT_CONFIG, ...configArg};

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
let db: mongodb.Db, tasks: mongodb.Collection<TaskDoc>;
mongodb.MongoClient.connect(
  `mongodb://${config.dbHost}:${config.dbPort}`, async (err, client) => {
    if (err) {
      throw err;
    }
    db = client.db(config.dbName);
    if (config.reinitDbOnStartup) {
      await db.dropDatabase();
      console.log(`Reinitialized db ${config.dbName}`);
    }
    tasks = db.collection('tasks');
    tasks.createIndex({ id: 1 }, { unique: true, sparse: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  static async taskExistsOrFail(id: string): Promise<void> {
    return Validation.exists(tasks, id, 'Task');
  }

  private static async existsOrFail(
    collection, id: string, type: string): Promise<void> {
    const doc = await collection.findOne({ id: id });
    if (!doc) {
      throw new Error(`${type} ${id} not found`);
    }
  }
}


interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

function isPendingCreate(task: TaskDoc | null) {
  return _.get(task, 'pending.type') === 'create-task';
}

async function updateTask(id: string, updateOp: object,
  updateType: 'update-task' | 'claim-task' | 'complete-task' | 'approve-task',
  context: Context): Promise<Boolean> {

  const notPendingTaskFilter = {
    id,
    pending: { $exists: false },
  };
  const reqIdPendingFilter = { 'pending.reqId': context.reqId };
  switch (context.reqType) {
    case 'vote':
      await Validation.taskExistsOrFail(id);
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
      await Validation.taskExistsOrFail(id);
      const updateObj = await tasks.updateOne(notPendingTaskFilter);
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

const resolvers = {
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
      return updateTask(id, { $set: input }, 'update-task', context);
    },
    claimTask: async (root, { id, assigneeId }, context: Context) => {
      return updateTask(
        id, { $set: { assigneeId: assigneeId } }, 'claim-task', context);
    },
    approveTask: async (root, { id }, context: Context) => {
      return updateTask(
        id, { $set: { approved: true } }, 'approve-task', context);
    },
    completeTask: async (root, { id }, context: Context) => {
      return updateTask(
        id, { $set: { completed: true } }, 'complete-task', context);
    }
  }
};


const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.post(/^\/dv\/(.*)\/(vote|commit|abort)\/.*/,
  (req, res, next) => {
    req['reqId'] = req.params[0];
    req['reqType'] = req.params[1];
    next();
  },
  bodyParser.json(),
  graphqlExpress((req) => {
    return {
      schema: schema,
      context: {
        reqType: req!['reqType'],
        reqId: req!['reqId']
      },
      formatResponse: (gqlResp) => {
        const reqType = req!['reqType'];
        switch (reqType) {
          case 'vote':
            return {
              result: (gqlResp.errors) ? 'no' : 'yes',
              payload: gqlResp
            };
          case 'abort':
          case 'commit':
            return 'ACK';
          case undefined:
            return gqlResp;
        }
      }
    };
  })
);

app.use('/graphql', bodyParser.json(), bodyParser.urlencoded({
  extended: true
}), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
