import {
  ClicheServer,
  ClicheServerBuilder,
  CONCURRENT_UPDATE_ERROR,
  Config,
  Context,
  Validation
} from 'cliche-server';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import {
  AddLabelsToItemInput,
  ItemsInput,
  LabelDoc,
  LabelsInput,
  PendingDoc
} from './schema';
import { v4 as uuid } from 'uuid';


function standardizeLabel(id: string): string {
  return id.trim()
    .toLowerCase();
}

class LabelValidation {
  static async labelExistsOrFail(
    labels: mongodb.Collection<LabelDoc>, id: string): Promise<LabelDoc> {
    return Validation.existsOrFail(labels, id, 'Label');
  }
}

function isPendingCreate(doc: LabelDoc | null) {
  return _.get(doc, 'pending.type') === 'create-label';
}

function resolvers(db: mongodb.Db, config: Config): object {
  const labels: mongodb.Collection<LabelDoc> = db.collection('labels');
  return {
    Query: {
      label: async (root, { id }) => {
        const label = await LabelValidation.labelExistsOrFail(
          labels, standardizeLabel(id));
        if (_.isNil(label) || isPendingCreate(label)) {
          throw new Error(`Label ${id} not found`);
        }

        return label;
      },

      items: async (root, { input }: { input: ItemsInput }) => {
        const matchQuery = {};
        const groupQuery = { _id: 0, itemIds: { $push: '$itemIds' } };
        const reduceOperator = {};
        let initialValue;

        if (input.labelIds) {
          // Items matching all labelIds
          const standardizedLabelIds = _.map(input.labelIds, standardizeLabel);
          matchQuery['id'] = {
            $in: standardizedLabelIds,
            pending: { $exists: false }
          };
          groupQuery['initialSet'] = { $first: '$itemIds' };
          initialValue = '$initialSet';
          reduceOperator['$setIntersection'] = ['$$value', '$$this'];
        } else {
          // No label filter
          initialValue = [];
          reduceOperator['$setUnion'] = ['$$value', '$$this'];
        }
        const results = await labels.aggregate([
          { $match: matchQuery },
          {
            $group: groupQuery
          },
          {
            $project: {
              itemIds: {
                $reduce: {
                  input: '$itemIds',
                  initialValue: initialValue,
                  in: reduceOperator
                }
              }
            }
          }
        ])
          .toArray();

        return !_.isEmpty(results) ? results[0].itemIds : [];
      },

      labels: async (root, { input }: { input: LabelsInput }) => {
        const query = { pending: { $exists: false } };
        if (input.itemId) {
          // Labels of an item
          query['itemIds'] = input.itemId;
        }

        return labels.find(query)
          .toArray();
      }
    },

    Label: {
      id: (label: LabelDoc) => label.id,
      itemIds: (label: LabelDoc) => label.itemIds
    },

    Mutation: {
      addLabelsToItem: async (
        root, { input }: { input: AddLabelsToItemInput }, context: Context) => {
        const labelIds = _.map(input.labelIds, standardizeLabel);

        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        const bulkUpdateBaseOps = _.map(labelIds, (labelId) => {
          return {
            updateOne: {
              filter: { id: labelId, pending: { $exists: false } }
            },
            upsert: true
          };
        });

        switch (context.reqType) {
          case 'vote':
            const bulkPendingUpdateOps = _.map(bulkUpdateBaseOps, (op) => {
              const newOp = _.cloneDeep(op);
              _.set(newOp, 'updateOne.update.$set', {
                pending: {
                  reqId: context.reqId,
                  type: 'add-labels-to-item'
                }
              });

              return newOp;
            });

            const pendingResult = await labels.bulkWrite(bulkPendingUpdateOps);
            const pendingModified =
              pendingResult.modifiedCount ? pendingResult.modifiedCount : 0;
            const pendingUpserted =
              pendingResult.upsertedCount ? pendingResult.upsertedCount : 0;

            if (pendingModified + pendingUpserted !== labelIds.length) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;

          case undefined:
            const bulkUpdateOps = _.map(bulkUpdateBaseOps, (op) => {
              const newOp = _.cloneDeep(op);
              _.set(newOp, 'updateOne.update.$push', { itemIds: input.itemId });

              return newOp;
            });

            const result = await labels.bulkWrite(bulkUpdateOps);
            const modified = result.modifiedCount ? result.modifiedCount : 0;
            const upserted = result.upsertedCount ? result.upsertedCount : 0;

            if (modified + upserted !== labelIds.length) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;

          case 'commit':
            const bulkCommitUpdateOps = _.map(bulkUpdateBaseOps, (op) => {
              const newOp = _.cloneDeep(op);
              _.set(newOp, 'updateOne.filter', reqIdPendingFilter);
              _.set(newOp, 'updateOne.update.$unset', { pending: '' });

              return newOp;
            });

            await labels.bulkWrite(bulkCommitUpdateOps);

            return;

          case 'abort':
            const bulkAbortUpdateOps = _.map(bulkUpdateBaseOps, (op) => {
              const newOp = _.cloneDeep(op);
              _.set(newOp, 'updateOne.filter', reqIdPendingFilter);
              _.set(newOp, 'updateOne.update', { pending: '' });

              return newOp;
            });

            await labels.bulkWrite(bulkAbortUpdateOps);

            return;
        }
      },

      createLabel: async (root, { id }, context: Context) => {
        const labelId = id ? standardizeLabel(id) : uuid();
        const newLabel: LabelDoc = { id: labelId };

        const reqIdPendingFilter = { 'pending.reqId': context.reqId };
        switch (context.reqType) {
          case 'vote':
            newLabel.pending = {
              reqId: context.reqId,
              type: 'create-label'
            };
          /* falls through */
          case undefined:
            await labels.insertOne(newLabel);

            return newLabel;
          case 'commit':
            await labels.updateOne(
              reqIdPendingFilter,
              { $unset: { pending: '' } });

            return;
          case 'abort':
            await labels.deleteOne(reqIdPendingFilter);

            return;
        }

        return newLabel;
      }
    }
  };
};

const labelCliche: ClicheServer = new ClicheServerBuilder('label')
  .initDb((db: mongodb.Db, config: Config): Promise<any> => {
    const labels: mongodb.Collection<LabelDoc> = db.collection('labels');
    return Promise.all([
      labels.createIndex({ id: 1 }, { unique: true, sparse: true }),
      labels.createIndex({ id: 1, itemIds: 1 }, { unique: true })
    ]);
  })
  .resolvers(resolvers)
  .build();

labelCliche.start();
