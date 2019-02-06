import {
  ClicheServer,
  ClicheServerBuilder,
  Config,
  Context
} from '@deja-vu/cliche-server';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import {
  PasskeyDoc,
  SignInOutput,
  VerifyInput
} from './schema';
import * as shajs from 'sha.js';
import { WORDS } from './words';


// TODO: Update passkey.validate.ts if any changes made
const PASSKEY_MIN_LENGTH = 3;
const PASSKEY_MAX_LENGTH = 15;

const WORDS_SIZE = WORDS.length;

// TODO: Change before deployment
const SECRET_KEY = 'ultra-secret-key';

class PasskeyValidation {
  static async passkeyExistsOrFail(passkeys: mongodb.Collection<PasskeyDoc>,
    code: string): Promise<PasskeyDoc> {
    const hashedCode = getHashedCode(code);
    const passkey: PasskeyDoc | null = await passkeys
      .findOne({ code: hashedCode });
    if (!passkey) {
      throw new Error(`Passkey ${code} not found.`);
    }

    return passkey;
  }

  static passkeyIsValidOrFail(value: string): void {
    const length: number = value.length;

    if (length < PASSKEY_MIN_LENGTH || length > PASSKEY_MAX_LENGTH) {
      throw new Error(`Passkey code must be
      ${PASSKEY_MIN_LENGTH}-${PASSKEY_MAX_LENGTH} characters long.`);
    }
  }
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
async function getRandomPasscode(passkeys: mongodb.Collection<PasskeyDoc>) {
  const randomIndex = Math.floor(Math.random() * WORDS_SIZE);
  const code = WORDS[randomIndex];

  return await passkeys
    .findOne({ code: getHashedCode(code) })
    .then((passkey) => {
      if (!passkey) { return code; }

      return getRandomPasscode(passkeys);
    });
}

async function createPasskey(passkeys: mongodb.Collection<PasskeyDoc>,
  code: string, context: Context) {
  if (_.isEmpty(code)) {
    // Generate random code
    code = await getRandomPasscode(passkeys);
  } else {
    const passkey = await passkeys.findOne({ code: getHashedCode(code) });
    if (passkey) {
      throw new Error(`Passkey ${code} already exists`);
    }

    PasskeyValidation.passkeyIsValidOrFail(code);
  }

  const newPasskey: PasskeyDoc = { code: getHashedCode(code) };
  const reqIdPendingFilter = { 'pending.reqId': context.reqId };
  switch (context.reqType) {
    case 'vote':
      newPasskey.pending = { reqId: context.reqId, type: 'create-passkey' };
    // tslint:disable-next-line:no-switch-case-fall-through
    case undefined:
      await passkeys.insertOne(newPasskey);

      return newPasskey;
    case 'commit':
      await passkeys.updateOne(reqIdPendingFilter, { $unset: { pending: '' } });

      return newPasskey;
    case 'abort':
      await passkeys.deleteOne(reqIdPendingFilter);

      return newPasskey;
  }

  return newPasskey;

}

function resolvers(db: mongodb.Db, _config: Config): object {
  const passkeys: mongodb.Collection<PasskeyDoc> = db.collection('passkeys');

  return {
    Query: {
      passkeys: () => passkeys.find({ pending: { $exists: false } })
        .toArray(),

      passkey: async (_root, { code }) => {
        const passkey: PasskeyDoc = await PasskeyValidation.passkeyExistsOrFail(
          passkeys, code);

        return isPendingCreate(passkey) ? null : passkey;
      },

      verify: (_root, { input }: { input: VerifyInput }) =>
        verify(input.token, input.code)
    },

    Passkey: {
      code: (passkey: PasskeyDoc) => passkey.code
    },

    SignInOutput: {
      token: (signInOutput: SignInOutput) => signInOutput.token,
      passkey: (signInOutput: SignInOutput) => signInOutput.passkey
    },

    Mutation: {
      createPasskey: async (_root, { code }, context: Context) => {
        const passkey = await createPasskey(passkeys, code, context);

        return passkey;
      },

      createAndValidatePasskey: async (_root, { code }, context: Context) => {
        const passkey = await createPasskey(passkeys, code, context);

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
        const passkey = await PasskeyValidation.passkeyExistsOrFail(
          passkeys, code);

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

    return passkeys.createIndex({ id: 1 }, { unique: true, sparse: true });
  })
  .resolvers(resolvers)
  .build();

passkeyCliche.start();
