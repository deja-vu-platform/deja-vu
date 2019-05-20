import {
  ActionRequestTable,
  ClicheDb,
  ClicheDbDuplicateKeyError,
  ClicheServer,
  ClicheServerBuilder,
  Collection,
  Config,
  Context,
  EMPTY_CONTEXT,
  getReturnFields
} from '@deja-vu/cliche-server';
import { IResolvers } from 'graphql-tools';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import {
  CreatePasskeyInput,
  PasskeyDoc,
  SignInOutput,
  VerifyInput
} from './schema';
import { WORDS } from './words';

import { v4 as uuid } from 'uuid';


// TODO: Update passkey.validate.ts if any changes made
const PASSKEY_MIN_LENGTH = 3;
const PASSKEY_MAX_LENGTH = 15;

// TODO: Change before deployment
const SECRET_KEY = 'ultra-secret-key';

class PasskeyValidation {
  static isCodeValid(value: string): void {
    const length: number = value.length;

    if (length < PASSKEY_MIN_LENGTH || length > PASSKEY_MAX_LENGTH) {
      throw new Error(`Passkey code must be
      ${PASSKEY_MIN_LENGTH}-${PASSKEY_MAX_LENGTH} characters long.`);
    }
  }
}

const actionRequestTable: ActionRequestTable = {
  'create-passkey': (extraInfo) => {
    switch (extraInfo.action) {
      case 'login':
        return `
          mutation Register($input: CreatePasskeyInput!) {
            createAndValidatePasskey(input: $input)
              ${getReturnFields(extraInfo)}
          }
        `;
      case 'register-only':
        return `
          mutation Register($input: CreatePasskeyInput!) {
            createPasskey(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'show-passkey': (extraInfo) => `
    query ShowPasskey($id: ID!) {
      passkey(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'sign-in': (extraInfo) => `
    mutation SignIn($code: String!) {
      validatePasskey(code: $code) ${getReturnFields(extraInfo)}
    }
  `,
  validate: (extraInfo) => `
    query Validate($input: VerifyInput!) {
      verify(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

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
async function getRandomPasscode(passkeys: Collection<PasskeyDoc>) {
  const results = await passkeys.aggregate([
    { $match: { used: false } },
    { $sample: { size: 1 } }
  ])
  .toArray();
  if (results.length === 0) {
    throw new Error(
      'No passcodes left to give out, but you may create your own.');
  }

  return results[0].code;
}

async function createPasskey(passkeys: Collection<PasskeyDoc>,
  input: CreatePasskeyInput, context: Context): Promise<PasskeyDoc> {
  let code;
  if (_.isEmpty(input.code)) {
    code = await getRandomPasscode(passkeys);
    await passkeys.updateOne(
      context, { code }, { $set: { used: true } });
  } else {
    PasskeyValidation.isCodeValid(input.code);
    code = input.code;
    try {
      await passkeys.insertOne(
        context, { id: input.id, code: input.code, used: true });
    } catch (err) {
      if (err.errorCode === ClicheDbDuplicateKeyError.ERROR_CODE) {
        throw new Error('Code is already in use. Please try another one.');
      }
      throw err;
    }
  }

  const id = input.id ? input.id : uuid();

  return { id, code };
}

function resolvers(db: ClicheDb, _config: Config): IResolvers {
  const passkeys: Collection<PasskeyDoc> = db.collection('passkeys');

  return {
    Query: {
      passkeys: () => passkeys.find(),

      passkey: async (_root, { id }) => await passkeys.findOne({ id }),

      verify: (_root, { input }: { input: VerifyInput }) =>
        verify(input.token, input.code)
    },

    Passkey: {
      id: (passkey: PasskeyDoc) => passkey.id,
      code: (passkey: PasskeyDoc) => passkey.code
    },

    SignInOutput: {
      token: (signInOutput: SignInOutput) => signInOutput.token,
      passkey: (signInOutput: SignInOutput) => signInOutput.passkey
    },

    Mutation: {
      createPasskey: async (
        _root, { input }: { input: CreatePasskeyInput }, context: Context) => {
        return await createPasskey(passkeys, input, context);
      },

      createAndValidatePasskey: async (
        _root, { input }: { input: CreatePasskeyInput }, context: Context) => {
        const passkey = await createPasskey(passkeys, input, context);

        return {
          token: sign(passkey.code),
          passkey: passkey
        };
      },

      validatePasskey: async (_root, { code }) => {
        const passkey = await passkeys.findOne({ code, used: true });

        return {
          token: sign(code),
          passkey: passkey
        };
      }
    }
  };
}

const passkeyCliche: ClicheServer = new ClicheServerBuilder('passkey')
  .initDb(async (db: ClicheDb, _config: Config): Promise<any> => {
    const passkeys: Collection<PasskeyDoc> = db.collection('passkeys');
    await Promise.all([
      passkeys.createIndex({ id: 1 }, { unique: true, sparse: true }),
      passkeys.createIndex({ code: 1 }, { unique: true, sparse: true }),
      passkeys.createIndex({ used: 1 }, { sparse: true })
    ]);

    await passkeys.insertMany(EMPTY_CONTEXT, _.map(WORDS, (code) => {
      return { id: code, code: code, used: false };
    }));

    return Promise.resolve();
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

passkeyCliche.start();
