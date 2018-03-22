import * as bcrypt from 'bcryptjs';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as jwt from 'jsonwebtoken';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';

import { graphiqlExpress, graphqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';

// TODO: Change before deployment
const SECRET_KEY = 'ultra-secret-key';
const SALT_ROUNDS = 10;

interface UserDoc {
  id: string;
  password: string;
}

interface User {
  id: string;
  password: string;
}

interface RegisterUserInput {
  id: string;
  password: string;
}

interface SignInUserInput {
  id: string;
  password: string;
}

interface ChangePasswordInput {
  id: string;
  oldPassword: string;
  newPassword: string;
}

interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'authentication-name';

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

const config: Config = { ...DEFAULT_CONFIG, ...configArg };

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
let db, users;
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

    users = db.collection('users');
    users.createIndex({ id: 1 }, { unique: true, sparse: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  static async userExists(id: string): Promise<UserDoc> {
    const doc = await users.findOne({ id: id });
    if (!doc) {
      throw new Error(`User ${id} not found`);
    }

    return doc;
  }

  static async userIsNew(id: string): Promise<Boolean> {
    const doc = await users.findOne({ id: id }, { _id: 1 });
    if (doc) {
      throw new Error(`User already exists`);
    }

    return true;
  }
}

const resolvers = {
  Query: {
    users: () => users.find()
      .toArray(),
    user: async (_, { id }) => users.findOne({ id: id })
  },

  User: {
    id: (user: User) => user.id,
    password: (user: User) => user.password
  },

  Mutation: {
    registerUser: async (_, { input }: { input: RegisterUserInput }) => {
      await Validation.userIsNew(input.id);
      const hash = await bcrypt.hash(input.password, SALT_ROUNDS);

      const newUser: UserDoc = {
        id: input.id,
        password: hash
      };

      await users.insertOne(newUser);

      return newUser;
    },

    signInUser: async (_, { input }: { input: SignInUserInput }) => {
      const user = await Validation.userExists(input.id);

      const passwordVerified = await bcrypt.compare(input.password,
        user.password);
      if (!passwordVerified) {
        throw new Error('Incorrect password');
      }

      const token = jwt.sign(user.id, SECRET_KEY);

      return JSON.stringify({
        token: token,
        user: user
      });
    },

    changePassword: async (_, { input }: { input: ChangePasswordInput }) => {
      const user = await Validation.userExists(input.id);

      const passwordVerified = await bcrypt.compare(input.oldPassword,
        user.password);
      if (!passwordVerified) {
        throw new Error('Incorrect password');
      }

      const newPasswordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
      const updateOperation = { $set: { password: newPasswordHash } };

      await users.updateOne({ id: input.id }, updateOperation);

      return true;
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
