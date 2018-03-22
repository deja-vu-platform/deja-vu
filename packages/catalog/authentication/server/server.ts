import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

import { graphiqlExpress, graphqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';

// TODO: Change before deployment
const SECRET_KEY = 'ultra-secret-key';
const SALT_ROUNDS = 10;

interface UserDoc {
  id: string;
  email?: string;
  password: string;
}

interface User {
  id: string;
  email?: string;
  password: string;
}

interface UserInput {
  id?: string;
  email?: string;
}

interface RegisterUserInput {
  id: string;
  email?: string;
  password: string;
}

interface SignInUserInput {
  id?: string;
  email?: string;
  password: string;
}

interface ChangePasswordInput {
  id?: string;
  email?: string;
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
// Change
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
  static async userExistsById(id: string): Promise<UserDoc> {
    const doc = await users.findOne({ id: id });
    if (!doc) {
      throw new Error(`User ${id} not found`);
    }

    return doc;
  }

  static async userExistsByEmail(email: string): Promise<UserDoc> {
    const doc = await users.findOne({ email: email });
    if (!doc) {
      throw new Error(`User ${email} not found`);
    }

    return doc;
  }

  static async userExistsByIdAndEmail(id: string, email: string): Promise<UserDoc> {
    const doc = await users.findOne({ id: id, email: email });
    if (!doc) {
      throw new Error(`User not found or username is not associated with email.`);
    }

    return doc;
  }

  static async userIsNew(id: string, email: string): Promise<Boolean> {
    const docFromId = await users.findOne({ id: id }, { _id: 1 });
    const docFromEmail = await users.findOne({ email: email }, { _id: 1 });

    if (docFromId || docFromEmail) {
      throw new Error(`User already exists`);
    }

    return true;
  }
}

const resolvers = {
  Query: {
    users: () => users.find().toArray(),
    user: async (root, { input }: { input: UserInput }) => {
      let user;
      if (input.id) {
        user = await Validation.userExistsById(input.id);
      } else if (input.email) {
        user = await Validation.userExistsByEmail(input.email);
      } else {
        throw new Error(`No information was provided to find a user`);
      }
    }
  },

  User: {
    id: (user: User) => user.id,
    email: (user: User) => user.email,
    password: (user: User) => user.password
  },

  Mutation: {
    registerUser: async (root, { input }: { input: RegisterUserInput }) => {
      const email = input.email ? input.email : 'not-an-email';
      await Validation.userIsNew(input.id, email);
      const hash = await bcrypt.hash(input.password, SALT_ROUNDS);

      const newUser: UserDoc = {
        id: input.id,
        email: input.email,
        password: hash
      };

      await users.insertOne(newUser);

      return newUser;
    },

    signInUser: async (root, { input }: { input: SignInUserInput }) => {
      // Sign in with either username (id) and/ or email
      let user;

      if (input.id && input.email) {
        user = await Validation.userExistsByIdAndEmail(input.id, input.email);
      } else if (input.id) {
        user = await Validation.userExistsById(input.id);
      } else if (input.email) {
        user = await Validation.userExistsByEmail(input.email);
      } else {
        throw new Error('No information was provided to find a user');
      }

      const passwordVerified = await bcrypt.compare(input.password, user.password);
      if (!passwordVerified) {
        throw new Error('Incorrect password');
      }

      const token = jwt.sign(user.id, SECRET_KEY);
      return JSON.stringify({
        token: token,
        user: user
      });
    },

    changePassword: async (root, { input }: { input: ChangePasswordInput }) => {
      let user;

      if (input.id && input.email) {
        user = await Validation.userExistsByIdAndEmail(input.id, input.email);
      } else if (input.id) {
        user = await Validation.userExistsById(input.id);
      } else if (input.email) {
        user = await Validation.userExistsByEmail(input.email);
      } else {
        throw new Error('No information was provided to find a user');
      }

      const passwordVerified = await bcrypt.compare(input.oldPassword, user.password);
      if (!passwordVerified) {
        throw new Error('Incorrect password');
      }

      const newPasswordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
      const updateOperation = { $set: { password: newPasswordHash } };

      if (input.id) {
        await users.updateOne({ id: input.id }, updateOperation);
      } else if (input.email) {
        await users.updateOne({ email: input.email }, updateOperation);
      }

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
