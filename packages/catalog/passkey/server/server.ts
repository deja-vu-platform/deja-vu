import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as jwt from 'jsonwebtoken';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import * as shajs from 'sha.js';
import { WORDS } from './words';

// GitHub Issue: https://github.com/apollographql/apollo-server/issues/927
// tslint:disable-next-line:no-var-requires
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');
import { makeExecutableSchema } from 'graphql-tools';

import * as _ from 'lodash';

// TODO: Update passkey.validate.ts if any changes made
const PASSKEY_MIN_LENGTH = 3;
const PASSKEY_MAX_LENGTH = 15;

const WORDS_SIZE = WORDS.length;

// TODO: Change before deployment
const SECRET_KEY = 'ultra-secret-key';

interface PasskeyDoc {
  code: string;
  pending?: PendingDoc;
}

interface PendingDoc {
  reqId: string;
  type: 'create-passkey' | 'sign-in';
}

interface SignInOutput {
  token: string;
  passkey: PasskeyDoc;
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

const name = argv.as ? argv.as : 'passkey';

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
let passkeys: mongodb.Collection<PasskeyDoc>;
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

    passkeys = db.collection('passkeys');
    passkeys.createIndex({ code: 1 }, { unique: true, sparse: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {

  static async passkeyExistsOrFail(code: string): Promise<PasskeyDoc> {
    const hashedCode = getHashedCode(code);
    const passkey: PasskeyDoc | null = await passkeys
      .findOne({ code: hashedCode });
    if (!passkey) {
      throw new Error(`Passkey ${code} not found.`);
    }

    return passkey;
  }

  static isPasskeyValid(value: string): void {
    const length: number = value.length;

    if (length < PASSKEY_MIN_LENGTH || length > PASSKEY_MAX_LENGTH) {
      throw new Error(`Passkey code must be
      ${PASSKEY_MIN_LENGTH}-${PASSKEY_MAX_LENGTH} characters long.`);
    }
  }
}

interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

function isPendingCreate(passkey: PasskeyDoc | null) {
  return _.get(passkey, 'pending.type') === 'create-passkey';
}

function getHashedCode(code: string): string {
  return shajs('sha256')
    .update(code)
    .digest('hex');
}

function sign(code: string): string {
  return jwt.sign(code, SECRET_KEY);
}

function verify(token: string, code: string): boolean {
  if (_.isNil(token)) {
    return false;
  }
  const tokenUserId: string = jwt.verify(token, SECRET_KEY);

  return tokenUserId === code;
}

/**
 * Generates a random code.
 * @returns{string} A unique 5-7 letter english word not found in the database.
 */
function getRandomPasscode() {
  const randomIndex = Math.floor(Math.random() * WORDS_SIZE);
  const code = WORDS[randomIndex];

  return passkeys
    .findOne({ code: getHashedCode(code) })
    .then((passkey) => {
      if (!passkey) { return code; }

      return getRandomPasscode();
    });
}

async function createPasskey(code: string, context: Context) {
  if (_.isEmpty(code)) {
    // Generate random code
    code = await getRandomPasscode();
  } else {
    const passkey = await passkeys.findOne({ code: getHashedCode(code) });
    if (passkey) {
      throw new Error(`Passkey ${code} already exists`);
    }

    Validation.isPasskeyValid(code);
  }

  const newPasskey: PasskeyDoc = { code: getHashedCode(code) };
  const reqIdPendingFilter = { 'pending.reqId': context.reqId };
  switch (context.reqType) {
    case 'vote':
      newPasskey.pending = { reqId: context.reqId, type: 'create-passkey' };
    case undefined:
      await passkeys.insertOne(newPasskey);

      return newPasskey;
    case 'commit':
      await passkeys.updateOne(reqIdPendingFilter, { $unset: { pending: '' } });

      return;
    case 'abort':
      await passkeys.deleteOne(reqIdPendingFilter);

      return;
  }

  return newPasskey;

}

const resolvers = {
  Query: {
    passkeys: () => passkeys.find({ pending: { $exists: false } })
      .toArray(),

    passkey: async (root, { code }) => {
      const passkey: PasskeyDoc = await Validation.passkeyExistsOrFail(code);

      return isPendingCreate(passkey) ? null : passkey;
    },

    verify: (root, { token, id }) => verify(token, id)
  },

  Passkey: {
    code: (passkey: PasskeyDoc) => passkey.code
  },

  SignInOutput: {
    token: (signInOutput: SignInOutput) => signInOutput.token,
    passkey: (signInOutput: SignInOutput) => signInOutput.passkey
  },

  Mutation: {
    createPasskey: async (root, { code }, context: Context) => {
      return createPasskey(code, context);
    },

    createAndValidatePasskey: async (root, { code }, context: Context) => {
      const passkey = await createPasskey(code, context);

      if (!_.isNil(passkey)) {
        const token: string = sign(passkey!.code);

        return {
          token: token,
          passkey: passkey
        };
      }

      return;
    },

    validatePasskey: async (root, { code }) => {
      const passkey = await Validation.passkeyExistsOrFail(code);

      const token: string = sign(code);

      return {
        token: token,
        passkey: passkey
      };
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
