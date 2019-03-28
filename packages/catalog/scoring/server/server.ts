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
import { v4 as uuid } from 'uuid';
import {
  CreateScoreInput,
  ScoreDoc,
  ShowScoreInput,
  ShowTargetInput,
  Target,
  TargetsByScoreInput
} from './schema';

interface ScoringConfig extends Config {
  /* Function body that calculates the total score
  based on the parameter scores which is an array of scores with type number */
  totalScoreFn?: string;
  /* Whether sourceId can give targetId a score only once or not */
  oneToOneScoring?: boolean;
}

const DEFAULT_TOTAL_SCORE_FN = (scores: number[]): number =>
  scores.reduce((total, score) => total + score, 0);

// TODO: maybe write a function that will autogenerate some repetitive parts
const actionRequestTable: ActionRequestTable = {
  'create-score': (extraInfo) => `
    mutation CreateScore($input: CreateScoreInput!) {
      createScore (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-score': (extraInfo) => `
    query ShowScore($input: ShowScoreInput!) {
      score(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-target': (extraInfo) => `
    query ShowTarget($input: ShowTargetInput!) {
      target(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-targets-by-score': (extraInfo) => `
    query ShowTargetsByScore($input: TargetsByScoreInput!) {
      targetsByScore(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

function resolvers(db: ClicheDb, config: ScoringConfig): object {
  const scores: Collection<ScoreDoc> = db.collection('scores');
  const totalScoreFn = config.totalScoreFn ?
    new Function('scores', config.totalScoreFn) : DEFAULT_TOTAL_SCORE_FN;

  return {
    Query: {
      score: async (_root, { input }: { input: ShowScoreInput }) => {
        // querying a score needs either an id, or a (sourceId, targetId) pair
        // and that there is oneToOneScoring
        if (_.isNil(input.id) &&
          (_.isNil(input.sourceId) || _.isNil(input.targetId) ||
            !config.oneToOneScoring)) {
          throw new Error('Insufficient inputs to query a score');
        }

        return await scores.findOne(input);
      },
      target: async (_root, { id }): Promise<Target> => {
        const targetScores: ScoreDoc[] = await scores.find({ targetId: id });

      target: async (
        _root, { input }: { input: ShowTargetInput }) => {
        const filter = { targetId: input.id, pending: { $exists: false } };
        if (!_.isNil(input.sourceId)) {
          filter['sourceId'] = input.sourceId;
        }

        const target = await scores.aggregate([
          { $match: filter },
          {
            $group: {
              _id: '$targetId',
              scores: { $push: '$$ROOT' },
              total: { $sum: '$value' }
            }
          },
          {
            $project: {
              id: '$_id',
              scores: '$scores',
              total: '$total'
            }
          }
        ])
          .next();

        return target;
      },

      // TODO: pagination, max num results
      targetsByScore: async (
        _root,
        { input }: { input: TargetsByScoreInput }): Promise<Target[]> => {
        const query = { pending: { $exists: false } };

        if (!_.isNil(input)) {
          if (!_.isNil(input.targetIds)) {
            query['targetId'] = { $in: input.targetIds };
          }

          if (!_.isNil(input.sourceId)) {
            query['sourceId'] = input.sourceId;
          }
        }

        const targets: any = await scores.aggregate([
          { $match: query },
          {
            $group: {
              _id: '$targetId', scores: { $push: '$$ROOT' }
            }
          }
        ])
        .toArray();

        return _(targets)
        .map((target) => {
          return {
            ...target,
            total: totalScoreFn(_.map(target.scores, 'value')),
            id: target._id
          };
        })
        .orderBy(['total'], [ asc ? 'asc' : 'desc' ])
        .value();
      }
    },
    Score: {
      id: (score: ScoreDoc) => score.id,
      value: (score: ScoreDoc) => score.value,
      targetId: (score: ScoreDoc) => score.targetId
    },
    Target: {
      id: (target: Target) => target.id,
      scores: (target: Target) => target.scores,
      total: (target: Target) => totalScoreFn(_.map(target.scores, 'value'))
    },
    Mutation: {
      createScore: async (
        _root, { input }: { input: CreateScoreInput }, context: Context) => {
        const newScore: ScoreDoc = {
          id: input.id ? input.id : uuid(),
          value: input.value,
          sourceId: input.sourceId,
          targetId: input.targetId
        };

        return await scores.insertOne(context, newScore);
      }
    }
  };
}

const scoringCliche: ClicheServer<ScoringConfig> =
  new ClicheServerBuilder<ScoringConfig>('scoring')
    .initDb((db: ClicheDb, config: ScoringConfig): Promise<any> => {
      const scores: Collection<ScoreDoc> = db.collection('scores');
      const sourceTargetIndexOptions = config.oneToOneScoring ?
        { unique: true, sparse: true } : {};

      return Promise.all([
        scores.createIndex({ id: 1 }, { unique: true, sparse: true }),
        scores.createIndex(
          { sourceId: 1, targetId: 1 }, sourceTargetIndexOptions)
      ]);
    })
    .actionRequestTable(actionRequestTable)
    .resolvers(resolvers)
    .build();

scoringCliche.start();
