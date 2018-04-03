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

import * as _ from 'lodash';


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

interface SignInOutput {
  token: string;
  user: User;
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

async function register(input: RegisterInput): Promise<User> {
  const hash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const newUser: UserDoc = {
    id: input.id ? input.id : uuid(),
    username: input.username,
    password: hash
  };

  await users.insertOne(newUser);

  return newUser;
}

function sign(userId: string): string {
  return jwt.sign(userId, SECRET_KEY);
}

function verify(token: string, userId: string): boolean {
  if (_.isNil(token)) {
    return false;
  }
  const tokenUserId: string = jwt.verify(token, SECRET_KEY);

  return tokenUserId === userId;
}

const resolvers = {
  Query: {
    users: () => users.find()
      .toArray(),
    user: (root, { username }) => users.findOne({ username: username}),
    userById: (root, { id }) => users.findOne({ id: id}),
    verify: (root, { token, id }) => verify(token, id)
  },

  User: {
    id: (user: User) => user.id,
    username: (user: User) => user.username
  },

  SignInOutput: {
    token: (signInOutput: SignInOutput) => signInOutput.token,
    user: (signInOutput: SignInOutput) => signInOutput.user
  },

  Mutation: {
    register: (root, { input }: { input: RegisterInput }) => register(input),

    registerAndSignIn: async (root, { input }: { input: RegisterInput }) => {
      const user = await register(input);
      const token: string = sign(user.id);

      return {
        token: token,
        user: user
      };
    },

    signIn: async (root, { input }: { input: SignInInput }) => {
      const user = await users.findOne({ username: input.username});
      if (!user) {
        throw new Error('Wrong username or password');
      }

      const passwordVerified = await bcrypt.compare(input.password,
        user.password);
      if (!passwordVerified) {
        throw new Error('Wrong username or password');
      }

      const token: string = sign(user.id);

      return {
        token: token,
        user: user
      };
    },

    changePassword: async (root, { input }: { input: ChangePasswordInput }) => {
      const user = await users.findOne({id: input.id});

      const passwordVerified = await bcrypt.compare(input.oldPassword,
        user.password);
      if (!passwordVerified) {
        throw new Error('Incorrect password');
      }

      const newPasswordHash = await bcrypt
        .hash(input.newPassword, SALT_ROUNDS);
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
