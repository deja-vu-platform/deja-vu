import * as bcrypt from 'bcryptjs';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as jwt from 'jsonwebtoken';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

// GitHub Issue: https://github.com/apollographql/apollo-server/issues/927
// tslint:disable-next-line:no-var-requires
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');
import { makeExecutableSchema } from 'graphql-tools';

import * as _ from 'lodash';

// TODO: Update authentication.validate.ts if any changes made
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 15;
const USERNAME_REGEX
  = new RegExp('^(?![_.-])(?!.*[_.-]{2})[a-zA-Z0-9._-]+$');
const USERNAME_PATTERN_MSG = 'alphanumeric and special characters ._-';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 20;
const PASSWORD_REGEX = new RegExp([
  '^.*(?=.*[a-zA-Z])(?=.*[0-9])',
  '(?=.*[!@#$%^&*])(?!.*[`~()\\-_=+[{\\]}\\\|;:\\\'",.<>/? ]).*$'
].join(''));
const PASSWORD_PATTERN_MSG = 'at least 1 lowercase letter, 1 uppercase '
  + 'letter, 1 special character (!@#$%^*&) and 1 number (0-9)';


// TODO: Change before deployment
const SECRET_KEY = 'ultra-secret-key';
const SALT_ROUNDS = 10;

interface UserDoc {
  id: string;
  username: string;
  password: string;
  pending?: PendingDoc;
}

interface PendingDoc {
  reqId: string;
  type: 'register' | 'change-password';
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

const CONCURRENT_UPDATE_ERROR = 'An error has occured. Please try again later';

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
let db: mongodb.Db;
let users: mongodb.Collection<UserDoc>;
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

class Validation {
  static async userExistsById(userId: string): Promise<UserDoc> {
    const user: UserDoc | null = await users.findOne({ id: userId });
    if (!user) {
      throw new Error(`User ${userId} not found.`);
    }

    return user;
  }

  static async userExistsByUsername(username: string): Promise<UserDoc> {
    const user: UserDoc | null = await users.findOne({ username: username });
    if (!user) {
      throw new Error(`User ${username} not found.`);
    }

    return user;
  }

  static async userIsNew(id: string, username: string) {
    const user: UserDoc | null = await users
      .findOne({
        $or: [
          { id: id }, { username: username }
        ]
      });
    if (user) {
      throw new Error(`User already exists.`);
    }

    return user;
  }

  static async verifyPassword(inputPassword: string, savedPassword: string)
    : Promise<Boolean> {
    const passwordVerified = await bcrypt.compare(inputPassword, savedPassword);
    if (!passwordVerified) {
      throw new Error('Incorrect password.');
    }

    return passwordVerified;
  }

  static isUsernameValid(username: string): Boolean {
    return (Validation.isLengthValid(username, USERNAME_MIN_LENGTH,
      USERNAME_MAX_LENGTH, 'Username') &&
      Validation.isPatternValid(username, USERNAME_REGEX, 'Username',
        USERNAME_PATTERN_MSG));
  }

  static isPasswordValid(password: string): Boolean {
    return (Validation.isLengthValid(password, PASSWORD_MIN_LENGTH,
      PASSWORD_MAX_LENGTH, 'Password') &&
      Validation.isPatternValid(password, PASSWORD_REGEX, 'Password',
        PASSWORD_PATTERN_MSG));
  }

  static isLengthValid(value: string, minLength: number, maxLength: number,
    type: string): Boolean {
    const length: number = value.length;

    if (length < minLength || length > maxLength) {
      throw new Error(`${type} must be ${minLength}-${maxLength} characters
      long.`);
    }

    return true;
  }

  static isPatternValid(value: string, regExp: RegExp, type: string,
    msg: string): Boolean {
    const valid = regExp.test(value);

    if (!valid) {
      throw new Error(`${type} must contain ${msg}`);
    }

    return valid;
  }
}

interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

function isPendingRegister(user: UserDoc | null) {
  return _.get(user, 'pending.type') === 'register';
}

async function newUserDocOrFail(input: RegisterInput): Promise<UserDoc> {
  Validation.isUsernameValid(input.username);
  Validation.isPasswordValid(input.password);

  const id = input.id ? input.id : uuid();

  await Validation.userIsNew(id, input.username);

  const hash = await bcrypt.hash(input.password, SALT_ROUNDS);

  return {
    id: id,
    username: input.username,
    password: hash
  };
}

async function register(input: RegisterInput, context: Context) {
  const reqIdPendingFilter = { 'pending.reqId': context.reqId };
  switch (context.reqType) {
    case 'vote':
      const newUserVote: UserDoc = await newUserDocOrFail(input);
      newUserVote.pending = { reqId: context.reqId, type: 'register' };

      await users.insertOne(newUserVote);

      return newUserVote;
    case undefined:
      const newUser: UserDoc = await newUserDocOrFail(input);
      await users.insertOne(newUser);

      return newUser;
    case 'commit':
      await users.updateOne(reqIdPendingFilter, { $unset: { pending: '' } });

      return;
    case 'abort':
      await users.deleteOne(reqIdPendingFilter);

      return;
  }
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
    users: () => users.find({ pending: { $exists: false } })
      .toArray(),
    user: async (root, { username }) => {
      const user: UserDoc | null = await users.findOne({ username: username });

      return isPendingRegister(user) ? null : user;
    },
    userById: async (root, { id }) => {
      const user: UserDoc | null = await users.findOne({ id: id });

      if (_.isNil(user) || isPendingRegister(user)) {
        throw new Error(`User ${id} not found`);
      }

      return user;
    },
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
    register: (root, { input }: { input: RegisterInput }, context: Context) => {
      return register(input, context);
    },

    registerAndSignIn: async (
      root, { input }: { input: RegisterInput }, context: Context) => {
      const user = await register(input, context);

      if (!_.isNil(user)) {
        const token: string = sign(user!.id);

        return {
          token: token,
          user: user
        };
      }

      return;
    },

    signIn: async (root, { input }: { input: SignInInput }) => {
      const user = await Validation.userExistsByUsername(input.username);
      const verification = await Validation.verifyPassword(input.password,
        user.password);

      const token: string = sign(user.id);

      return {
        token: token,
        user: user
      };
    },

    changePassword: async (
      root, { input }: { input: ChangePasswordInput }, context: Context) => {
      Validation.isPasswordValid(input.newPassword);
      const user = await Validation.userExistsById(input.id);
      const verification =
        await Validation.verifyPassword(input.oldPassword, user.password);
      const newPasswordHash = await bcrypt
        .hash(input.newPassword, SALT_ROUNDS);

      const updateOp = { $set: { password: newPasswordHash } };

      const notPendingUserFilter = {
        id: input.id,
        pending: { $exists: false }
      };
      const reqIdPendingFilter = { 'pending.reqId': context.reqId };

      switch (context.reqType) {
        case 'vote':
          const pendingUpdateObj = await users.updateOne(
            notPendingUserFilter,
            {
              $set: {
                pending: {
                  reqId: context.reqId,
                  type: 'change-password'
                }
              }
            });
          if (pendingUpdateObj.matchedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;

        case undefined:
          await Validation.userExistsById(input.id);
          const updateObj = await users
            .updateOne(notPendingUserFilter, updateOp);
          if (updateObj.matchedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;

        case 'commit':
          await users.updateOne(
            reqIdPendingFilter,
            { ...updateOp, $unset: { pending: '' } });

          return false;

        case 'abort':
          await users
            .updateOne(reqIdPendingFilter, { $unset: { pending: '' } });

          return false;
      }

      return false;
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
