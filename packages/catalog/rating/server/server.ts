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
import * as _ from 'lodash';
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
  'show-rating-count': (extraInfo) => `
    query ShowRatingCount($input: RatingsInput!) {
      ratingCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-ratings-by-target': (extraInfo) => `
    query ShowRatingsByTarget($input: RatingsInput!) {
      ratings(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

function getRatingFilter(input: RatingsInput) {
  const filter = {};
  if (!_.isNil(input)) {
    if (input.bySourceId) {
      // All ratings by a source
      filter['sourceId'] = input.bySourceId;
    }

    if (input.ofTargetId) {
      // All ratings of a target
      filter['targetId'] = input.ofTargetId;
    }
  }

  return filter;
}

function resolvers(db: ClicheDb, _config: Config): object {
  const ratings: Collection<RatingDoc> = db.collection('ratings');

  return {
    Query: {
      rating: async (_root, { input }: { input: RatingInput }) => await ratings
          .findOne({ sourceId: input.bySourceId, targetId: input.ofTargetId }),

      ratings: async (_root, { input }: { input: RatingsInput }) => {
        return await ratings.find(getRatingFilter(input));
      },

      ratingCount: async (_root, { input }: { input: RatingsInput }) => {
        return await ratings.countDocuments(getRatingFilter(input));
      },

      averageRatingForTarget: async (_root, { targetId }) => {
        const results = await ratings.aggregate([
          { $match: { targetId: targetId } },
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
        const filter = {
          sourceId: input.sourceId,
          targetId: input.targetId
        };

        return await ratings.updateOne(
          context,
          filter,
          { $set: { rating: input.newRating } },
          { upsert: true });

        // If there's a concurrent update then the upsert will fail because
        // of the (sourceId, targetId) index
      }
    }
  };
}

const ratingCliche: ClicheServer = new ClicheServerBuilder('rating')
  .initDb((db: ClicheDb, _config: Config): Promise<any> => {
    const ratings: Collection<RatingDoc> = db.collection('ratings');

    return ratings.createIndex(
      { sourceId: 1, targetId: 1 }, { unique: true, sparse: true });
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

ratingCliche.start();
