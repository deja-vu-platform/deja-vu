import * as bcrypt from 'bcryptjs';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as jwt from 'jsonwebtoken';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import { graphiqlExpress, graphqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';

// TODO: Change before deployment
const SECRET_KEY = 'ultra-secret-key';
const SALT_ROUNDS = 10;

interface UserDoc {
  id: string;
  username: string;
  password: string;
}

interface User {
  id: string;
  username: string;
  password: string;
}

interface RegisterInput {
  id: string | undefined;
  username: string;
  password: string;
}

interface SignInInput {
  username: string;
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

const name = argv.as ? argv.as : 'authentication';

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
    users.createIndex({ username: 1 }, { unique: true, sparse: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

const resolvers = {
  Query: {
    users: () => users.find()
      .toArray(),
    user: (_, { username }) => users.findOne({ username: username}),
    userById: (_, { id }) => users.findOne({ id: id})
  },

  User: {
    id: (user: User) => user.id,
    username: (user: User) => user.username
  },

  Mutation: {
    register: async (_, { input }: { input: RegisterInput }) => {
      const hash = await bcrypt.hash(input.password, SALT_ROUNDS);
      const newUser: UserDoc = {
        id: input.id ? input.id : uuid(),
        username: input.username,
        password: hash
      };

      await users.insertOne(newUser);

      return newUser;
    },

    signIn: async (_, { input }: { input: SignInInput }) => {
      const user = await users.findOne({ username: input.username});
      if (!user) {
        throw new Error('Wrong username or password');
      }

      const passwordVerified = await bcrypt.compare(input.password,
        user.password);
      if (!passwordVerified) {
        throw new Error('Wrong username or password');
      }

      const token = jwt.sign(user.id, SECRET_KEY);

      return JSON.stringify({
        token: token,
        user: user
      });
    },

    changePassword: async (_, { input }: { input: ChangePasswordInput }) => {
      const user = await users.findOne({id: input.id});

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
