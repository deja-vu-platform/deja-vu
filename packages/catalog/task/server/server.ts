import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

// GitHub Issue: https://github.com/apollographql/apollo-server/issues/927
// tslint:disable-next-line:no-var-requires
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');
import { makeExecutableSchema } from 'graphql-tools';


interface TaskDoc {
  id: string;
  assignerId: string;
  assigneeId: string;
  dueDate: string;
  completed: boolean;
  approved: boolean;
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
  static async taskExists(id: string): Promise<TaskDoc> {
    return Validation.exists(tasks, id, 'Task');
  }

  private static async exists(collection, id: string, type: string) {
    const doc = await collection.findOne({ id: id });
    if (!doc) {
      throw new Error(`${type} ${id} not found`);
    }

    return doc;
  }
}


const resolvers = {
  Query: {
    tasks: async (root, { input }: { input: TasksInput }) => {
      const filterOp = _.omit(input, ['assigned']);
      if (input.assigned === false) {
        filterOp['assigneeId'] = null;
      }
      const matchingTasks: TaskDoc[] = await tasks.find(filterOp)
        .toArray();

      return matchingTasks;
    },
    task: async (root, { id }) => {
      const task = await Validation.taskExists(id);

      return task;
    }/*,
    assignees: (root) => assignees.find()
      .toArray()*/
  },
  Task: {
    id: (task: TaskDoc) => task.id,
    assignerId: (task: TaskDoc) => task.assignerId,
    assigneeId: (task: TaskDoc) => task.assigneeId,
    dueDate: (task: TaskDoc) => task.dueDate
  },
  Mutation: {
    createTask: async (root, { input }: {input: CreateTaskInput}) => {
      const newTask: TaskDoc = {
        id: input.id ? input.id : uuid(),
        assignerId: input.assignerId,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate,
        completed: false,
        approved: false
      };
      await tasks.insertOne(newTask);

      return newTask;
    },
    updateTask: async (root, { input }: {input: UpdateTaskInput}) => {
      const updateObj = { $set: input };
      const res = await tasks.findOneAndUpdate({ id: input.id }, updateObj);

      return res.value;
    },
    claimTask: async (root, { id, assigneeId }) => {
      const res = await tasks
        .findOneAndUpdate({ id: id }, { $set: { assigneeId: assigneeId}});

      return res.value;
    },
    approveTask: async (root, { id }) => {
      const res = await tasks
        .findOneAndUpdate({ id: id }, { $set: { approved: true }});

      return res.value;
    },
    completeTask: async (root, { id }) => {
      const res = await tasks
        .findOneAndUpdate({ id: id }, { $set: { completed: true }});

      return res.value;
    }
  }
};


const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.use('/graphql', bodyParser.json(), bodyParser.urlencoded({
  extended: true
}), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
