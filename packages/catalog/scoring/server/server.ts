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
  Target
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
    query ShowTarget($id: ID!) {
      target(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-targets-by-score': (extraInfo) => `
    query ShowTargetsByScore($asc: Boolean) {
      targetsByScore(asc: $asc) ${getReturnFields(extraInfo)}
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

        return {
          id: id,
          scores: targetScores
        };
      },
      // TODO: pagination, max num results
      targetsByScore: async (
        _root, { asc }: { asc: boolean }): Promise<Target[]> => {
        const targets: any = await scores.aggregate([
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
