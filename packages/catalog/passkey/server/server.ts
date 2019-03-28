import {
  ActionRequestTable,
  ClicheDb,
  ClicheServer,
  ClicheServerBuilder,
  Collection,
  Config,
  Context,
  EMPTY_CONTEXT,
  getReturnFields
} from '@deja-vu/cliche-server';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import * as shajs from 'sha.js';
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

const actionRequestTable: ActionRequestTable = {
  'create-passkey': (extraInfo) => {
    switch (extraInfo.action) {
      case 'create':
        return `
          mutation CreatePasskey($code: String!) {
            createPasskey(code: $code) ${getReturnFields(extraInfo)}
          }
        `;
      case 'createAndValidate':
        return `
          mutation CreateAndValidatePasskey($code: String!) {
            createAndValidatePasskey(code: $code) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'sign-in': (extraInfo) => `
    mutation ValidatePasskey($code: String!) {
      validatePasskey(code: $code) ${getReturnFields(extraInfo)}
    }
  `,
  validate: (_extraInfo) => `
    query Verify($input: VerifyInput!) {
      verify(input: $input)
    }
  `
};

class PasskeyValidation {
  static passkeyIsValidOrFail(value: string): void {
    const length: number = value.length;

    if (length < PASSKEY_MIN_LENGTH || length > PASSKEY_MAX_LENGTH) {
      throw new Error(`Passkey code must be
      ${PASSKEY_MIN_LENGTH}-${PASSKEY_MAX_LENGTH} characters long.`);
    }
  }
}

function getHashedCode(code: string): string {
  return shajs('sha256')
    .update(code)
    .digest('hex');
}

function sign(code: string): string {
  return jwt.sign(code, SECRET_KEY);
}

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
  code: string, context: Context): Promise<PasskeyDoc> {
  let hashedCode;
  if (_.isEmpty(code)) {
    hashedCode = await getRandomPasscode(passkeys);
    await passkeys.updateOne(
      context, { code: hashedCode }, { $set: { used: true } });
  } else {
    PasskeyValidation.passkeyIsValidOrFail(code);
    hashedCode = getHashedCode(code);
    await passkeys.insertOne(
      context, { code: hashedCode, used: true });
  }

  return { code: hashedCode };
}

function resolvers(db: ClicheDb, _config: Config): object {
  const passkeys: Collection<PasskeyDoc> = db.collection('passkeys');

  return {
    Query: {
      passkeys: () => passkeys.find(),

      passkey: async (_root, { code }) => await passkeys.findOne({ code }),

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
      createPasskey: async (_root, { code }, context: Context) => {
        return await createPasskey(passkeys, code, context);
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
        const passkey = await passkeys.findOne(
          { code: getHashedCode(code), used: true });

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
      passkeys.createIndex({ code: 1 }, { unique: true, sparse: true }),
      passkeys.createIndex({ used: 1 }, { sparse: true })
    ]);

    await passkeys.insertMany(EMPTY_CONTEXT, _.map(WORDS, (code) => {
      return { code: getHashedCode(code), used: false };
    }));

    return Promise.resolve();
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

passkeyCliche.start();
