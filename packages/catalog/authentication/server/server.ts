import * as bcrypt from 'bcryptjs';
import {
  ActionRequestTable,
  ClicheServer,
  ClicheServerBuilder,
  CONCURRENT_UPDATE_ERROR,
  Config,
  Context,
  getReturnFields,
  Validation
} from '@deja-vu/cliche-server';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import {
  ChangePasswordInput,
  RegisterInput,
  SignInInput,
  SignInOutput,
  User,
  UserDoc,
  VerifyInput
} from './schema';
import { v4 as uuid } from 'uuid';


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

class UserValidation {
  static async userExistsById(
    users: mongodb.Collection<UserDoc>, userId: string): Promise<UserDoc> {
    return Validation.existsOrFail(users, userId, 'User');
  }

  static async userExistsByUsername(
    users: mongodb.Collection<UserDoc>, username: string): Promise<UserDoc> {
    const user: UserDoc | null = await users.findOne({ username: username });
    if (!user) {
      throw new Error(`User ${username} not found.`);
    }

    return user;
  }

  static async userIsNew(users: mongodb.Collection<UserDoc>, id: string,
    username: string): Promise<void> {
    const user: UserDoc | null = await users
      .findOne({
        $or: [
          { id: id }, { username: username }
        ]
      });
    if (user) {
      throw new Error(`User already exists.`);
    }
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
    return (UserValidation.isLengthValid(username, USERNAME_MIN_LENGTH,
      USERNAME_MAX_LENGTH, 'Username') &&
      UserValidation.isPatternValid(username, USERNAME_REGEX, 'Username',
        USERNAME_PATTERN_MSG));
  }

  static isPasswordValid(password: string): Boolean {
    return (UserValidation.isLengthValid(password, PASSWORD_MIN_LENGTH,
      PASSWORD_MAX_LENGTH, 'Password') &&
      UserValidation.isPatternValid(password, PASSWORD_REGEX, 'Password',
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

const actionRequestTable: ActionRequestTable = {
  'authenticate': (extraInfo) => `
    query Authenticate($input: VerifyInput!) {
      verify(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'change-password': (extraInfo) => `
    mutation ChangePassword($input: ChangePasswordInput!) {
      changePassword (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'register-user': (extraInfo) => {
    switch (extraInfo.action) {
      case 'login':
        return `
          mutation Register($input: RegisterInput!) {
            registerAndSignIn(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'register-only':
        return `
          mutation Register($input: RegisterInput!) {
            register(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'show-user': (extraInfo) => `
    query ShowUser($id: String!) {
      userById(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-user-count': (extraInfo) => `
    query ShowUserCount {
      userCount ${getReturnFields(extraInfo)}
    }
  `,
  'show-users': (extraInfo) => `
    query ShowUsers($input: UsersInput!) {
      users(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'sign-in': (extraInfo) => `
    mutation SignIn($input: SignInInput!) {
      signIn (input: $input) ${getReturnFields(extraInfo)}
    }
  `
}

function isPendingRegister(user: UserDoc | null) {
  return _.get(user, 'pending.type') === 'register';
}

async function newUserDocOrFail(
  users: mongodb.Collection<UserDoc>, input: RegisterInput): Promise<UserDoc> {
  UserValidation.isUsernameValid(input.username);
  UserValidation.isPasswordValid(input.password);

  const id = input.id ? input.id : uuid();

  await UserValidation.userIsNew(users, id, input.username);

  const hash = await bcrypt.hash(input.password, SALT_ROUNDS);

  return {
    id: id,
    username: input.username,
    password: hash
  };
}

async function register(
  users: mongodb.Collection<UserDoc>, input: RegisterInput, context: Context) {
  const reqIdPendingFilter = { 'pending.reqId': context.reqId };
  switch (context.reqType) {
    case 'vote':
      const newUserVote: UserDoc = await newUserDocOrFail(users, input);
      newUserVote.pending = { reqId: context.reqId, type: 'register' };

      await users.insertOne(newUserVote);

      return newUserVote;
    case undefined:
      const newUser: UserDoc = await newUserDocOrFail(users, input);
      await users.insertOne(newUser);

      return newUser;
    case 'commit':
      await users.updateOne(reqIdPendingFilter, { $unset: { pending: '' } });

      return undefined;
    case 'abort':
      await users.deleteOne(reqIdPendingFilter);

      return undefined;
  }

  return undefined;
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

function resolvers(db: mongodb.Db, _config: Config): object {
  const users: mongodb.Collection<UserDoc> = db.collection('users');
  return {
    Query: {
      users: () => users.find({ pending: { $exists: false } })
        .toArray(),

      user: async (_root, { username }) => {
        const user: UserDoc | null = await users.findOne({ username: username });

        return isPendingRegister(user) ? null : user;
      },

      userById: async (_root, { id }) => {
        const user: UserDoc | null = await users.findOne({ id: id });

        if (_.isNil(user) || isPendingRegister(user)) {
          throw new Error(`User ${id} not found`);
        }

        return user;
      },

      userCount: () => users.count({ pending: { $exists: false } }),

      verify: (_root, { input }: { input: VerifyInput }) => verify(
        input.token, input.id)
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
      register: (
        _root, { input }: { input: RegisterInput }, context: Context) => {
        return register(users, input, context);
      },

      registerAndSignIn: async (
        _root, { input }: { input: RegisterInput }, context: Context) => {
        const user = await register(users, input, context);

        if (!_.isNil(user)) {
          const token: string = sign(user!.id);

          return {
            token: token,
            user: user
          };
        }

        return undefined;
      },

      signIn: async (_root, { input }: { input: SignInInput }) => {
        const user = await UserValidation
          .userExistsByUsername(users, input.username);
        await UserValidation.verifyPassword(input.password, user.password);

        const token: string = sign(user.id);

        return {
          token: token,
          user: user
        };
      },

      changePassword: async (
        _root, { input }: { input: ChangePasswordInput }, context: Context) => {
        UserValidation.isPasswordValid(input.newPassword);
        const user = await UserValidation.userExistsById(users, input.id);
        await UserValidation.verifyPassword(input.oldPassword, user.password);
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
            await UserValidation.userExistsById(users, input.id);
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
}

const authenticationCliche: ClicheServer =
  new ClicheServerBuilder('authentication')
    .initDb((db: mongodb.Db, _config: Config): Promise<any> => {
      const users: mongodb.Collection<UserDoc> = db.collection('users');

      return Promise.all([
        users.createIndex({ id: 1 }, { unique: true, sparse: true }),
        users.createIndex({ username: 1 }, { unique: true, sparse: true })
      ]);
    })
    .actionRequestTable(actionRequestTable)
    .resolvers(resolvers)
    .build();

authenticationCliche.start();
