import {
  Collection,
  ComponentRequestTable,
  ConceptDb,
  ConceptServer,
  ConceptServerBuilder,
  Config,
  Context,
  getReturnFields
} from '@deja-vu/concept-server';
import { IResolvers } from 'graphql-tools';
import * as _ from 'lodash';
import {
  DeleteRatingInput,
  DeleteRatingsInput,
  RatingDoc,
  RatingInput,
  RatingsInput,
  SetRatingInput
} from './schema';

const componentRequestTable: ComponentRequestTable = {
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
  `,
  'delete-rating': (extraInfo) => `
    mutation DeleteRating($input: DeleteRatingInput!) {
      deleteRating(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-ratings': (extraInfo) => `
    mutation DeleteRatings($input: DeleteRatingsInput!) {
      deleteRatings(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'filter-ratings': (extraInfo) => `
    query FilterRatings($input: FilterRatingInput) {
      findRatingsHigher(input: $input) ${getReturnFields(extraInfo)}
    }
   `,
  'filter-targets': (extraInfo) => `
    query FilterTargets($input: FilterTargetInput) {
      targetsRatedHigherThan(input: $input) ${getReturnFields(extraInfo)}
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

function resolvers(db: ConceptDb, _config: Config): IResolvers {
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
      },

      findRatingsHigher: async (_root, { input }) => ( !!input.minimumRating && input.minimumRating > 0 ?
          ratings.find( { rating: { $gte: input.minimumRating} } ) : ratings.find() ),

      targetsRatedHigherThan: async (_root, { input }) => (!!input && !!input.minimumAvgRating ?
          ratings.aggregate([
            {
              $group: {
                _id: '$targetId',
                targetId: { $first: '$targetId'},
                rating: {$avg: '$rating'},
                count: {$sum: 1}
              }
            },
            {
              $match: {rating: {$gte: input.minimumAvgRating}}
            }
          ]) :
          ratings.aggregate([
            {
              $group: {
                _id: '$targetId',
                targetId: { $first: '$targetId'},
                rating: {$avg: '$rating'},
                count: {$sum: 1}
              }
            }
          ])).toArray()
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
      },

      deleteRating: async (
        _root, { input }: { input: DeleteRatingInput }, context: Context) => {
        return await ratings.deleteOne(context, getRatingFilter(input));
      },

      deleteRatings: async (
        _root, { input }: { input: DeleteRatingsInput }, context: Context) => {
        return await ratings.deleteMany(context, getRatingFilter(input));
      }
    }
  };
}

const ratingConcept: ConceptServer = new ConceptServerBuilder('rating')
  .initDb((db: ConceptDb, _config: Config): Promise<any> => {
    const ratings: Collection<RatingDoc> = db.collection('ratings');

    return ratings.createIndex(
      { sourceId: 1, targetId: 1 }, { unique: true, sparse: true });
  })
  .componentRequestTable(componentRequestTable)
  .resolvers(resolvers)
  .build();

ratingConcept.start();
