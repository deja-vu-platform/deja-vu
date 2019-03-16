import {
  ActionRequestTable,
  ClicheServer,
  ClicheServerBuilder,
  Config,
  Context,
  getReturnFields
} from '@deja-vu/cliche-server';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
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

const WORDS_SIZE = WORDS.length;

// TODO: Change before deployment
const SECRET_KEY = 'ultra-secret-key';

class PasskeyValidation {
  static async passkeyExistsByCode(passkeys: mongodb.Collection<PasskeyDoc>,
    code: string): Promise<PasskeyDoc> {
    const passkey: PasskeyDoc | null = await passkeys
      .findOne({ code: code });

    if (_.isNil(passkey)) {
      throw new Error(`Passkey not found.`);
    }

    return passkey;
  }


  static async passkeyIsNew(passkeys: mongodb.Collection<PasskeyDoc>,
    id: string, code: string): Promise<PasskeyDoc> {
    const passkey: PasskeyDoc | null = await passkeys
      .findOne({
        $or: [
          { id: id }, { code: code }
        ]
      });

    if (passkey) {
      throw new Error(`Passkey already exists.`);
    }

    return passkey;
  }

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
            createAndValidatePasskey(input: $input) ${getReturnFields(extraInfo)}
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
  'validate': (extraInfo) => `
    query Validate($input: VerifyInput!) {
      verify(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

function isPendingCreate(passkey: PasskeyDoc | null) {
  return _.get(passkey, 'pending.type') === 'create-passkey';
}

async function newPasskeyDocOrFail(passkeys: mongodb.Collection<PasskeyDoc>,
  input: CreatePasskeyInput): Promise<PasskeyDoc> {

  if (_.isEmpty(input.code)) {
    input.code = await getRandomPasscode(passkeys);
  }

  PasskeyValidation.isCodeValid(input.code);

  const id = input.id ? input.id : uuid();

  await PasskeyValidation.passkeyIsNew(passkeys, id, input.code);

  return {
    id: id,
    code: input.code
  };
}

/**
 * Generates a random code.
 * @returns{string} A unique 5-7 letter english word not found in the database.
 */
async function getRandomPasscode(passkeys: mongodb.Collection<PasskeyDoc>) {
  const randomIndex = Math.floor(Math.random() * WORDS_SIZE);
  const code = WORDS[randomIndex];

  return await passkeys
    .findOne({ code: code })
    .then((passkey) => {
      if (!passkey) { return code; }

      return getRandomPasscode(passkeys);
    });
}

async function createPasskey(passkeys: mongodb.Collection<PasskeyDoc>,
  input: CreatePasskeyInput, context: Context): Promise<PasskeyDoc> {
  const reqIdPendingFilter = { 'pending.reqId': context.reqId };
  switch (context.reqType) {
    case 'vote':
      const newPasskeyVote: PasskeyDoc =
        await newPasskeyDocOrFail(passkeys, input);
      newPasskeyVote.pending = { reqId: context.reqId, type: 'create-passkey' };

      await passkeys.insertOne(newPasskeyVote);

      return newPasskeyVote;
    case undefined:
      const newPasskey: PasskeyDoc = await newPasskeyDocOrFail(passkeys, input);
      await passkeys.insertOne(newPasskey);

      return newPasskey;
    case 'commit':
      await passkeys.updateOne(reqIdPendingFilter, { $unset: { pending: '' } });

      return undefined;
    case 'abort':
      await passkeys.deleteOne(reqIdPendingFilter);

      return undefined;
  }

  return undefined;
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

function resolvers(db: mongodb.Db, _config: Config): object {
  const passkeys: mongodb.Collection<PasskeyDoc> = db.collection('passkeys');

  return {
    Query: {
      passkeys: () => passkeys.find({ pending: { $exists: false } })
        .toArray(),

      passkey: async (_root, { id }) => {
        const passkey: PasskeyDoc | null = await passkeys.findOne({ id: id });

        if (_.isNil(passkey) || isPendingCreate(passkey)) {
          throw new Error(`Passkey ${id} not found`);
        }

        return passkey;
      },

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
        const passkey = await createPasskey(passkeys, input, context);

        return passkey;
      },

      createAndValidatePasskey: async (
        _root, { input }: { input: CreatePasskeyInput }, context: Context) => {
        const passkey = await createPasskey(passkeys, input, context);

        if (!_.isNil(passkey)) {
          const token: string = sign(passkey!.code);

          return {
            token: token,
            passkey: passkey
          };
        }

        return undefined;
      },

      validatePasskey: async (_root, { code }) => {
        const passkey = await PasskeyValidation
          .passkeyExistsByCode(passkeys, code);

        const token: string = sign(code);

        return {
          token: token,
          passkey: passkey
        };
      }
    }
  };
}

const passkeyCliche: ClicheServer = new ClicheServerBuilder('passkey')
  .initDb((db: mongodb.Db, _config: Config): Promise<any> => {
    const passkeys: mongodb.Collection<PasskeyDoc> = db.collection('passkeys');

    return Promise.all([
      passkeys.createIndex({ id: 1 }, { unique: true, sparse: true }),
      passkeys.createIndex({ code: 1 }, { unique: true, sparse: true })
    ]);
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

passkeyCliche.start();
