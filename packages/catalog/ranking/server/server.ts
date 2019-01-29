import {
  ActionRequestTable,
  ClicheServer,
  ClicheServerBuilder,
  Config,
  Context,
  getReturnFields
} from 'cliche-server';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import {
  CreateRankingInput,
  RankingDoc,
  Target
} from './schema';
import { v4 as uuid } from 'uuid';


interface RankingConfig extends Config {
  /* Whether sourceId can give targetId a rank only once or not */
  oneToOneRanking?: boolean;
}

const actionRequestTable: ActionRequestTable = {
  'create-ranking': (extraInfo) => `
    mutation CreateRanking($input: CreateRankingInput!) {
      createRanking(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-ranking': (extraInfo) => `
    query ShowRanking($id: ID!) {
      ranking(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-target-rankings': (extraInfo) => `
    query ShowTargetRankings($targetIds: [ID!]) {
      targetRankings(targetIds: $targetIds) ${getReturnFields(extraInfo)}
    }
  `
};

function resolvers(db: mongodb.Db, _config: RankingConfig): object {
  const rankings: mongodb.Collection<RankingDoc> = db.collection('rankings');

  return {
    Query: {
      ranking: async (_root, { id }) => {
        return await rankings.find({
          id: id, pending: { $exists: false }
        }).toArray();
      },
      targetRankings: async (_root, { targetIds }) => {
        const query = {
          targetId: { $in: targetIds },
          pending: { $exists: false }
        };

        const targetRankings = await rankings.aggregate([
          { $match: query },
          { $group: { _id: '$targetId', rank: { $avg: '$rank' } } },
          { $project: { id: "$_id", rank: 1 } }
        ])
        .sort({ rank: 1 }).toArray();

        return targetRankings;
      }
    },
    Ranking: {
      id: (ranking: RankingDoc) => ranking.id,
      sourceId: (ranking: RankingDoc) => ranking.sourceId,
      targetId: (ranking: RankingDoc) => ranking.targetId,
      rank: (ranking: RankingDoc) => ranking.rank
    },
    Target: {
      id: (target: Target) => target.id,
      rank: (target: Target) => target.rank
    },
    Mutation: {
      createRanking: async (
        _root, { input }: { input: CreateRankingInput }, context: Context) => {
        const rankingId = input.id ? input.id : uuid();
        const newRankings: RankingDoc[] = _.map(input.targets,
          (target: Target) => {
            return {
              id: rankingId,
              sourceId: input.sourceId,
              targetId: target.id,
              rank: target.rank
            }
          }
        );

        const reqIdPendingFilter = { 'pending.reqId': context.reqId };
        switch (context.reqType) {
          case 'vote':
            newRankings.forEach((ranking: RankingDoc) => {
              ranking.pending = {
                reqId: context.reqId,
                type: 'create-ranking'
              };
            });
          /* falls through */
          case undefined:
            await rankings.insertMany(newRankings);

            return newRankings;
          case 'commit':
            await rankings.update(
              reqIdPendingFilter,
              { $unset: { pending: '' } });

            return newRankings;
          case 'abort':
            await rankings.deleteMany(reqIdPendingFilter);

            return newRankings;
        }

        return newRankings;
      }
    }
  };
}

const rankingCliche: ClicheServer<RankingConfig> =
  new ClicheServerBuilder<RankingConfig>('ranking')
    .initDb((db: mongodb.Db, config: RankingConfig): Promise<any> => {
      const rankings: mongodb.Collection<RankingDoc> = db.collection('rankings');
      const sourceTargetIndexOptions = config.oneToOneRanking ?
        { unique: true, sparse: true } : {};

      return Promise.all([
        rankings.createIndex({ id: 1, rank: 1 }, { unique: true, sparse: true }),
        rankings.createIndex(
          { sourceId: 1, targetId: 1 }, sourceTargetIndexOptions)
      ]);
    })
    .actionRequestTable(actionRequestTable)
    .resolvers(resolvers)
    .build();

rankingCliche.start();
