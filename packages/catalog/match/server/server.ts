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
  MatchesInput,
  MatchInput
} from './schema';

import { IResolvers } from 'graphql-tools';
import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';


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
    query ShowMatch($input: MatchInput!) {
      match(input: $input) ${getReturnFields(extraInfo)}
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

function resolvers(db: ClicheDb, _config: Config): IResolvers {
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

      match: async (_root, { input }: { input: MatchInput }) => {
        if (!_.isNil(input.id)) {
          return await matches.findOne({ id: input.id });
        } else {
          return await matches
            .findOne({
              $or: [
                {
                  $and: [
                    { userAId: input.userAId }, { userBId: input.userBId }
                  ]
                },
                {
                  $and: [
                    { userAId: input.userBId }, { userBId: input.userAId }
                  ]
                }
              ]
            });
        }
      },

      matches: async (_root, { input }: { input: MatchesInput }) => {
        const filter = {};
        if (!_.isNil(input.userId)) {
          filter['$or'] = [
            { userAId: input.userId },
            { userBId: input.userId }
          ];
        }

        return await matches.find(filter);
      }
    },

    Match: {
      id: (match: MatchDoc) => match.id,
      userAId: (match: MatchDoc) => match.userAId,
      userBId: (match: MatchDoc) => match.userBId
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

          // if the delete operation succeeds, we found an attempt necessary
          // to create a match
          await attempts.deleteOne(context, filter);

          const match: MatchDoc = {
            id: uuid(),
            userAId: input.sourceId,
            userBId: input.targetId
          };

          await matches.insertOne(context, match);

          return true;
        } catch (error) {
          // there was no other attempt to make a match with sourceId + targetId
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
          userAId: input.userAId,
          userBId: input.userBId
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
      matches.createIndex({ userAId: 1, userBId: 1 },
        { unique: true, sparse: true }),
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
