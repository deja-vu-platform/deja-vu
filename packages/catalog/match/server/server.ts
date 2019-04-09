import {
  ActionRequestTable,
  ClicheDb,
  ClicheServer,
  ClicheServerBuilder,
  Collection,
  Config,
  Context,
  getReturnFields
} from '@deja-vu/cliche-server';
import {
  AttemptDoc,
  AttemptMatchInput,
  AttemptsInput,
  CreateMatchInput,
  MatchDoc,
  MatchesInput
} from './schema';

import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

// each action should be mapped to its corresponding GraphQl request here
const actionRequestTable: ActionRequestTable = {
  'attempt-match': (extraInfo) => `
    mutation AttemptMatch($input: AttemptMatchInput!) {
      attemptMatch(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'create-match': (extraInfo) => `
    mutation CreateMatch($input: CreateMatchInput!) {
      createMatch(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-match': (extraInfo) => `
    mutation DeleteMatch($id: ID!) {
      deleteMatch(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-attempt': (extraInfo) => `
    query ShowAttempt($id: ID!) {
      attempt(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-attempts': (extraInfo) => `
    query ShowAttempts($input: AttemptsInput!) {
      attempts(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-match': (extraInfo) => `
    query ShowMatch($id: ID!) {
      match(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-matches': (extraInfo) => `
    query ShowMatches($input: MatchesInput!) {
      matches(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'withdraw-attempt': (extraInfo) => `
    mutation WithdrawAttempt($id: ID!) {
      withdrawAttempt(id: $id) ${getReturnFields(extraInfo)}
    }
  `
};

function resolvers(db: ClicheDb, _config: Config): object {
  const matches: Collection<MatchDoc> = db.collection('matches');
  const attempts: Collection<AttemptDoc> = db.collection('attempts');

  return {
    Query: {
      attempt: async (_root, { id }) => await attempts.findOne({ id }),

      attempts: async (_root, { input }: { input: AttemptsInput }) => {
        const filter = {};
        if (!_.isNil(input.sourceId)) { filter['sourceId'] = input.sourceId; }
        if (!_.isNil(input.targetId)) { filter['targetId'] = input.targetId; }

        return await attempts.find(filter);
      },

      match: async (_root, { id }) => await matches.findOne({ id }),

      matches: async (_root, { input }: { input: MatchesInput }) => {
        const filter = {};
        if (!_.isNil(input.userId)) { filter['userId'] = input.userId; }

        return await matches.find(filter);
      }
    },

    Match: {
      id: (match: MatchDoc) => match.id,
      userIds: (match: MatchDoc) => match.userIds
    },

    Attempt: {
      id: (attempt: AttemptDoc) => attempt.id,
      sourceId: (attempt: AttemptDoc) => attempt.sourceId,
      targetId: (attempt: AttemptDoc) => attempt.targetId
    },

    Mutation: {
      attemptMatch: async (
        _root, { input }: { input: AttemptMatchInput }, context: Context) => {

        try {
          const filter = {
            sourceId: input.targetId,
            targetId: input.sourceId
          };
          await attempts.deleteOne(context, filter);

          const match: MatchDoc = {
            id: uuid(),
            userIds: [input.sourceId, input.targetId]
          };

          await matches.insertOne(context, match);

          return true;
        } catch (error) {
          const attempt: AttemptDoc = {
            id: input.id ? input.id : uuid(),
            sourceId: input.sourceId,
            targetId: input.targetId
          };

          await attempts.insertOne(context, attempt);

          return false;
        }
      },

      withdrawAttempt: async (_root, { id }, context: Context) => {
        return await attempts.deleteOne(context, { id: id });
      },

      createMatch: async (
        _root, { input }: { input: CreateMatchInput }, context: Context) => {
        const match: MatchDoc = {
          id: input.id ? input.id : uuid(),
          userIds: input.userIds
        };

        return await matches.insertOne(context, match);
      },

      deleteMatch: async (_root, { id }, context: Context) =>
        await matches.deleteOne(context, { id })
    }
  };
}

const matchCliche: ClicheServer = new ClicheServerBuilder('match')
  .initDb((db: ClicheDb, _config: Config): Promise<any> => {
    const matches: Collection<MatchDoc> = db.collection('matches');
    const attempts: Collection<AttemptDoc> = db.collection('attempts');

    return Promise.all([
      matches.createIndex({ id: 1 }, { unique: true, sparse: true }),
      attempts.createIndex({ id: 1 }, { unique: true, sparse: true }),
      // one attempt per source, target pair
      attempts.createIndex({ sourceId: 1, targetId: 1 },
        { unique: true, sparse: true })
    ]);
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

matchCliche.start();
