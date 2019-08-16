import {
  Collection,
  ComponentRequestTable,
  ConceptDb,
  ConceptServer,
  ConceptServerBuilder,
  Config,
  Context,
  getReturnFields,
  Validation
} from '@deja-vu/concept-server';
import * as bcrypt from 'bcryptjs';
import { IResolvers } from 'graphql-tools';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
import {
  ChangePasswordInput,
  RegisterInput,
  SignInInput,
  SignInOutput,
  User,
  UserDoc,
  VerifyInput
} from './schema';


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
    users: Collection<UserDoc>, userId: string): Promise<UserDoc> {
    return Validation.existsOrFail(users, userId, 'User');
  }

  static async userExistsByUsername(
    users: Collection<UserDoc>, username: string): Promise<UserDoc> {
    return await users.findOne({ username: username });
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

const componentRequestTable: ComponentRequestTable = {
  authenticate: (extraInfo) => `
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
};

async function getNewUserDoc(input: RegisterInput): Promise<UserDoc> {
  UserValidation.isUsernameValid(input.username);
  UserValidation.isPasswordValid(input.password);

  const id = input.id ? input.id : uuid();

  const hash = await bcrypt.hash(input.password, SALT_ROUNDS);

  return {
    id: id,
    username: input.username,
    password: hash
  };
}

async function register(
  users: Collection<UserDoc>, input: RegisterInput, context: Context) {
  const newUser: UserDoc = await getNewUserDoc(input);
  // this will fail for duplicate users because of the unique index
  // on both id and username

  return await users.insertOne(context, newUser);
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

function resolvers(db: ConceptDb, _config: Config): IResolvers {
  const users: Collection<UserDoc> = db.collection('users');

  return {
    Query: {
      users: async () => await users.find(),
      user: async (_root, { username }) => await users.findOne({ username }),
      userById: async (_root, { id }) => await users.findOne({ id: id }),
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

        const token: string = sign(user!.id);

        return {
          token: token,
          user: user
        };
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

        return await users.updateOne(context, { id: input.id }, updateOp);
      }
    }
  };
}

const authenticationConcept: ConceptServer =
  new ConceptServerBuilder('authentication')
    .initDb((db: ConceptDb, _config: Config): Promise<any> => {
      const users: Collection<UserDoc> = db.collection('users');

      return Promise.all([
        users.createIndex({ id: 1 }, { unique: true, sparse: true }),
        users.createIndex({ username: 1 }, { unique: true, sparse: true })
      ]);
    })
    .componentRequestTable(componentRequestTable)
    .resolvers(resolvers)
    .build();

authenticationConcept.start();
