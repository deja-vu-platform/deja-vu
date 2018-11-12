import {
  ClicheServer,
  ClicheServerBuilder,
  Config,
  Context
} from 'cliche-server';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import {
  CreateScoreInput,
  ScoreDoc,
  Target
} from './schema';
import { v4 as uuid } from 'uuid';

interface ScoringConfig extends Config {
  /* Function body that calculates the total score
  based on the parameter scores which is an array of scores with type number */
  totalScoreFn?: string;
  /* Whether sourceId can give targetId a score only once or not */
  oneToOneScoring?: boolean;
}

const DEFAULT_TOTAL_SCORE_FN = (scores: number[]): number =>
  scores.reduce((total, score) => total + score, 0);

function isPendingCreate(doc: ScoreDoc | null) {
  return _.get(doc, 'pending.type') === 'create-score';
}

function resolvers(db: mongodb.Db, config: ScoringConfig): object {
  const scores: mongodb.Collection<ScoreDoc> = db.collection('scores');
  const totalScoreFn = config.totalScoreFn ?
    new Function('scores', config.totalScoreFn) : DEFAULT_TOTAL_SCORE_FN;

  return {
    Query: {
      score: async (_root, { id }) => {
        const score = await scores.findOne({
          id: id, pending: { $exists: false }
        });

        if (_.isNil(score) || isPendingCreate(score)) {
          throw new Error(`Score ${id} not found`);
        }

        return score;
      },
      target: async (_root, { id }): Promise<Target> => {
        const targetScores: ScoreDoc[] = await scores.find({
          targetId: id, pending: { $exists: false }
        })
          .toArray();

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
          }, {
            $match: { pending: { $exists: false } }
          }
        ]).toArray();

        return _(targets)
        .map((target) => {
          return {
            ...target,
            total: totalScoreFn(_.map(target.scores, 'value')),
            id: target._id
          }
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
        if (config.oneToOneScoring) {
          const existing = await scores.findOne({
            sourceId: input.sourceId, targetId: input.targetId,
            pending: { $exists: false } });
          if (existing) {
            throw new Error(`Source ${input.sourceId} already has a score for 
              target ${input.targetId}`);
          }
        }
        const newScore: ScoreDoc = {
          id: input.id ? input.id : uuid(),
          value: input.value,
          sourceId: input.sourceId,
          targetId: input.targetId
        };

        const reqIdPendingFilter = { 'pending.reqId': context.reqId };
        switch (context.reqType) {
          case 'vote':
            newScore.pending = {
              reqId: context.reqId,
              type: 'create-score'
            };
          /* falls through */
          case undefined:
            await scores.insertOne(newScore);

            return newScore;
          case 'commit':
            await scores.updateOne(
              reqIdPendingFilter,
              { $unset: { pending: '' } });

            return newScore;
          case 'abort':
            await scores.deleteOne(reqIdPendingFilter);

            return newScore;
        }

        return newScore;
      }
    }
  };
}

const scoringCliche: ClicheServer<ScoringConfig> =
  new ClicheServerBuilder<ScoringConfig>('scoring')
    .initDb((db: mongodb.Db, _config: ScoringConfig): Promise<any> => {
      const scores: mongodb.Collection<ScoreDoc> = db.collection('scores');

      return Promise.all([
        scores.createIndex({ id: 1 }, { unique: true, sparse: true }),
        scores.createIndex({ targetId: 1 })
      ]);
    })
    .resolvers(resolvers)
    .build();

scoringCliche.start();
