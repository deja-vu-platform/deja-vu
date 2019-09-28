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
import { v4 as uuid } from 'uuid';
import {
  CreateRankingInput,
  Ranking,
  RankingDoc,
  RankingsInput,
  TargetRank
} from './schema';


interface RankingConfig extends Config {
  /* Whether sourceId can give targetId a rank only once or not */
  oneToOneRanking?: boolean;
}

const componentRequestTable: ComponentRequestTable = {
  'create-ranking': (extraInfo) => `
    mutation CreateRanking($input: CreateRankingInput!) {
      createRanking(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-ranking': (extraInfo) => `
    query ShowRanking($id: ID!, $sourceId: ID) {
      ranking(id: $id, sourceId: $sourceId) ${getReturnFields(extraInfo)}
    }
  `,
  'show-rankings': (extraInfo) => `
    query ShowRankings($input: RankingsInput!) {
      rankings(input: $input) ${getReturnFields(extraInfo)}
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

function resolvers(db: ConceptDb, _config: RankingConfig): IResolvers {
  const rankings: Collection<RankingDoc> = db.collection('rankings');

  return {
    Query: {
      ranking: async (_root, { id, sourceId }) => {
        const query = {};
        if (id) {
          query['id'] = id;
        }
        if (sourceId) {
          query['sourceId'] = sourceId;
        }
        const rankingDocs = await rankings.find(query);

        if (rankingDocs.length === 0) {
          throw new Error(`Ranking ${id} not found`);
        }

        return rankingDocsToRanking(rankingDocs);
      },
      rankings: async (_root, { input }: { input: RankingsInput }) => {
        const groupedRankingDocs = await rankings.aggregate([
          { $match: input },
          {
            $group: {
              _id: { id: '$id', sourceId: '$sourceId' },
              rankingDocs: { $push: '$$ROOT' }
            }
          }
        ])
        .toArray() as any[]; // .aggregate() typing is wrong

        return groupedRankingDocs.map(
          (group) => rankingDocsToRanking(group.rankingDocs));
      },
      // In the future, all ranking strategies of ranking could be supported.
      // For now, we only implement fractional ranking
      // https://en.wikipedia.org/wiki/Ranking#Strategies_for_assigning_rankings
      fractionalRanking: async (_root, { targetIds }) => {
        const targetRankings = await rankings.aggregate([
          { $match: { targetId: { $in: targetIds } } },
          { $group: { _id: '$targetId', sumRank: { $sum: '$rank' } } },
          { $project: { id: '$_id', sumRank: 1 } }
        ])
        .sort({ sumRank: 1 })
        .toArray();

        const scores = _.map(targetRankings, 'sumRank');
        const reversedScores = scores.slice(0)
          .reverse();

        return targetRankings.map((target) => {
          const score = target['sumRank'];
          target['rank'] = (scores.indexOf(score) + 1 +
            reversedScores.length - reversedScores.indexOf(score)) / 2;

          return target;
        });
      }
    },
    Ranking: {
      id: (ranking: Ranking) => ranking.id,
      sourceId: (ranking: Ranking) => ranking.sourceId,
      targets: (ranking: Ranking) => ranking.targets
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
            };
          }
        );
        await rankings.insertMany(context, rankingDocs);

        return rankingDocsToRanking(rankingDocs);
      }
    }
  };
}

const rankingConcept: ConceptServer<RankingConfig> =
  new ConceptServerBuilder<RankingConfig>('ranking')
    .initDb((db: ConceptDb, config: RankingConfig): Promise<any> => {
      const rankings: Collection<RankingDoc> = db.collection('rankings');
      const sourceTargetIndexOptions = config.oneToOneRanking ?
        { unique: true, sparse: true } : {};

      return Promise.all([
        rankings.createIndex(
          { id: 1, sourceId: 1, rank: 1 }, { unique: true, sparse: true }),
        rankings.createIndex(
          { sourceId: 1, targetId: 1 }, sourceTargetIndexOptions)
      ]);
    })
    .componentRequestTable(componentRequestTable)
    .resolvers(resolvers)
    .build();

rankingConcept.start();
