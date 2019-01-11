import {
  ActionRequestTable,
  ClicheServer,
  ClicheServerBuilder,
  CONCURRENT_UPDATE_ERROR,
  Config,
  Context,
  getReturnFields
} from 'cliche-server';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import {
  RatingDoc,
  RatingInput,
  RatingsInput,
  SetRatingInput
} from './schema';

const actionRequestTable: ActionRequestTable = {
  'rate-target': (extraInfo) => {
    switch (extraInfo.action) {
      case 'load':
        return `
          query LoadRating($input: RatingInput!) {
            rating(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'set':
        return `
          mutation SetRating($input: SetRatingInput!) {
            setRating(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'show-average-rating': (extraInfo) => `
    query ShowAverageRating($targetId: ID!) {
      averageRatingForTarget(targetId: $targetId) ${getReturnFields(extraInfo)}
    }
  `,
  'show-rating': (extraInfo) => `
    query ShowRating($input: RatingInput!) {
      rating(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-ratings-by-target': (extraInfo) => `
    query ShowRatingsByTarget($input: RatingsInput!) {
      ratings(input: $input) ${getReturnFields(extraInfo)}
    }
  `
}

function isPendingUpdate(doc: RatingDoc | null) {
  return _.get(doc, 'pending.type') === 'update-rating';
}

function resolvers(db: mongodb.Db, _config: Config): object {
  const ratings: mongodb.Collection<RatingDoc> = db.collection('ratings');

  return {
    Query: {
      rating: async (_root, { input }: { input: RatingInput }) => {
        const rating = await ratings
          .findOne({ sourceId: input.bySourceId, targetId: input.ofTargetId });

        if (_.isNil(rating) || isPendingUpdate(rating)) {
          throw new Error(`Rating by ${input.bySourceId} for target
           ${input.ofTargetId} does not exist`);
        }

        return rating;
      },

      ratings: (_root, { input }: { input: RatingsInput }) => {
        const filter = { pending: { $exists: false } };
        if (input.bySourceId) {
          // All ratings by a source
          filter['sourceId'] = input.bySourceId;
        }

        if (input.ofTargetId) {
          // All ratings of a target
          filter['targetId'] = input.ofTargetId;
        }

        return ratings.find(filter)
          .toArray();
      },

      averageRatingForTarget: async (_root, { targetId }) => {
        const results = await ratings.aggregate([
          // Ignore ratings that are currently being updated
          { $match: { targetId: targetId, pending: { $exists: false } } },
          {
            $group:
            {
              _id: 0,
              average: { $avg: '$rating' },
              count: { $sum: 1 }
            }
          }
        ])
          .toArray();

        if (_.isEmpty(results)) { throw new Error(`Target does not exist`); }

        return {
          rating: results[0]['average'],
          count: results[0]['count']
        };
      }
    },

    Rating: {
      sourceId: (rating: RatingDoc) => rating.sourceId,
      targetId: (rating: RatingDoc) => rating.targetId,
      rating: (rating: RatingDoc) => rating.rating
    },

    Mutation: {
      setRating: async (
        _root, { input }: { input: SetRatingInput }, context: Context) => {
        const notPendingRatingFilter = {
          sourceId: input.sourceId,
          targetId: input.targetId,
          pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        switch (context.reqType) {
          case 'vote':
            const pendingUpdateObj = await ratings.updateMany(
              notPendingRatingFilter,
              {
                $set: {
                  pending: {
                    reqId: context.reqId,
                    type: 'set-rating'
                  }
                }
              },
              { upsert: true }
            );

            if (pendingUpdateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;

          case undefined:
            const updateObj = await ratings.updateMany(
              notPendingRatingFilter,
              { $set: { rating: input.newRating } },
              { upsert: true });
            if (updateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;

          case 'commit':
            await ratings.updateMany(
              reqIdPendingFilter,
              {
                $set: { rating: input.newRating },
                $unset: { pending: '' }
              },
              { upsert: true }
            );

            return false;

          case 'abort':
            await ratings.updateMany(
              reqIdPendingFilter,
              { $unset: { pending: '' } },
              { upsert: true }
            );

            return false;
        }

        return false;
      }
    }
  };
}

const ratingCliche: ClicheServer = new ClicheServerBuilder('rating')
  .initDb((db: mongodb.Db, _config: Config): Promise<any> => {
    const ratings: mongodb.Collection<RatingDoc> = db.collection('ratings');

    return ratings.createIndex(
      { sourceId: 1, targetId: 1 }, { unique: true, sparse: true });
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

ratingCliche.start();
