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
  Ranking,
  RankingDoc,
  TargetRank
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
  'show-fractional-ranking': (extraInfo) => `
    query ShowFractionRanking($targetIds: [ID!]) {
      fractionalRanking(targetIds: $targetIds) ${getReturnFields(extraInfo)}
    }
  `
};

function rankingDocsToRanking(rankingDocs: RankingDoc[]): Ranking {
  if (rankingDocs.length === 0) {
    throw new Error('Could not create Ranking object without targets');
  }

  return {
    id: rankingDocs[0].id,
    sourceId: rankingDocs[0].sourceId,
    targets: rankingDocs.map((rankingDoc): TargetRank => {
      return {
        id: rankingDoc.targetId,
        rank: rankingDoc.rank
      };
    })
  };
}

function resolvers(db: mongodb.Db, _config: RankingConfig): object {
  const rankings: mongodb.Collection<RankingDoc> = db.collection('rankings');

  return {
    Query: {
      ranking: async (_root, { id }) => {
        const rankingDocs = await rankings.find({
          id: id, pending: { $exists: false }
        }).toArray();

        if (rankingDocs.length === 0) {
          throw new Error(`Ranking ${id} not found`);
        }

        return rankingDocsToRanking(rankingDocs);
      },
      // In the future, all ranking strategies of ranking could be supported.
      // For now, we only implement fractional ranking
      // https://en.wikipedia.org/wiki/Ranking#Strategies_for_assigning_rankings
      fractionalRanking: async (_root, { targetIds }) => {
        const query = {
          targetId: { $in: targetIds },
          pending: { $exists: false }
        };

        const targetRankings = await rankings.aggregate([
          { $match: query },
          { $group: { _id: '$targetId', avgRank: { $avg: '$rank' } } },
          { $project: { id: "$_id", avgRank: 1 } }
        ])
        .sort({ avgRank: 1 }).toArray();

        // calculate the rankings of just the targetIds relative to each othe
        // based on their average rankings
        let nextRank = 1;
        let nextRankCount = 1;
        let prevRank;
        for (let i = 0; i < targetRankings.length; i++) {
          const target = targetRankings[i];
          if (i === 0 || target['avgRank'] !== prevRank) {
            // Here we calculate the fractional ranking,
            // e.g. if there's a tie for rank 2 between 2 targets,
            // they will both have rank 2.5 and the next target will be ranked 4
            // where 2.5 is the average of the ordinal ranks 2 and 3.
            // uses the formula (a+b)/(2*n) to get the sum from a, a+1, ..., b
            // where b=a+n-1, a=nextRank, n=nextRankCount
            const tiedRank = (2 * nextRank + nextRankCount - 1)/(2 * nextRankCount);
            for (let j = i - nextRankCount + 1; j <= i; j++) {
              targetRankings[j]['rank'] = tiedRank;
            }
            nextRank += nextRankCount;
            nextRankCount = 1;
            prevRank = target['avgRank'];
          } else {
            nextRankCount++;
          }
        }

        return targetRankings;
      }
    },
    Ranking: {
      id: (ranking: Ranking) => ranking.id,
      sourceId: (ranking: Ranking) => ranking.sourceId,
      targets: (ranking: Ranking) => ranking.targets,
    },
    TargetRank: {
      id: (target: TargetRank) => target.id,
      rank: (target: TargetRank) => target.rank
    },
    Mutation: {
      createRanking: async (
        _root, { input }: { input: CreateRankingInput }, context: Context) => {
        const rankingId = input.id ? input.id : uuid();
        const rankingDocs: RankingDoc[] = _.map(input.targets,
          (target: TargetRank) => {
            return {
              id: rankingId,
              sourceId: input.sourceId,
              targetId: target.id,
              rank: target.rank
            }
          }
        );
        const newRanking = rankingDocsToRanking(rankingDocs);

        const reqIdPendingFilter = { 'pending.reqId': context.reqId };
        switch (context.reqType) {
          case 'vote':
            rankingDocs.forEach((ranking: RankingDoc) => {
              ranking.pending = {
                reqId: context.reqId,
                type: 'create-ranking'
              };
            });
          /* falls through */
          case undefined:
            await rankings.insertMany(rankingDocs);

            return newRanking;
          case 'commit':
            await rankings.update(
              reqIdPendingFilter,
              { $unset: { pending: '' } });

            return newRanking;
          case 'abort':
            await rankings.deleteMany(reqIdPendingFilter);

            return newRanking;
        }

        return newRanking;
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
