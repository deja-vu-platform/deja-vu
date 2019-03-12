import {
  ActionRequestTable,
  ClicheServer,
  ClicheServerBuilder,
  CONCURRENT_UPDATE_ERROR,
  Config,
  Context,
  getReturnFields,
  Validation
} from '@deja-vu/cliche-server';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import {
  AddLabelsToItemInput,
  ItemsInput,
  LabelDoc,
  LabelsInput
} from './schema';

import { v4 as uuid } from 'uuid';

interface LabelConfig extends Config {
  initialLabelIds: LabelDoc[];
}

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

const actionRequestTable: ActionRequestTable = {
  'attach-labels': (extraInfo) => `
    mutation AttachLabels($input: AddLabelsToItemInput!) {
      addLabelsToItem(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'create-label': (extraInfo) => `
    mutation CreateLabel($id: ID!) {
      createLabel(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'search-items-by-labels': (extraInfo) => {
    switch (extraInfo.action) {
      case 'items':
        return `
          query SearchItemsByLabel($input: ItemsInput) {
            items(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'labels':
        return `
          query SearchItemsByLabel($input: LabelsInput) {
            labels(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'show-items': (extraInfo) => `
    query ShowItems($input: ItemsInput) {
      items(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-item-count': (extraInfo) => `
    query ShowItemCount($input: ItemsInput) {
      itemCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-labels': (extraInfo) => `
    query ShowLabels($input: LabelsInput) {
      labels(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-label-count': (extraInfo) => `
    query ShowLabelCount($input: LabelsInput) {
      labelCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

function isPendingCreate(doc: LabelDoc | null) {
  return _.get(doc, 'pending.type') === 'create-label';
}

function getLabelFilter(input: LabelsInput) {
  const filter = { pending: { $exists: false } };
  if (!_.isNil(input) && !_.isNil(input.itemId)) {
    // Labels of an item
    filter['itemIds'] = input.itemId;
  }

  return filter;
}

async function getItems(labels: mongodb.Collection<LabelDoc>,
  input: ItemsInput) {
  const matchQuery = {};
  const groupQuery = { _id: 0, itemIds: { $push: '$itemIds' } };
  const reduceOperator = {};
  let initialValue;

  if (!_.isNil(input) && !_.isNil(input.labelIds)) {
    // Items matching all labelIds
    const standardizedLabelIds = _.map(input.labelIds, standardizeLabel);
    matchQuery['id'] = { $in: standardizedLabelIds };
    matchQuery['pending'] = { $exists: false };
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
}

function resolvers(db: mongodb.Db, _config: LabelConfig): object {
  const labels: mongodb.Collection<LabelDoc> = db.collection('labels');

  return {
    Query: {
      label: async (_root, { id }) => {
        const label = await LabelValidation.labelExistsOrFail(
          labels, standardizeLabel(id));
        if (_.isNil(label) || isPendingCreate(label)) {
          throw new Error(`Label ${id} not found`);
        }

        return label;
      },

      items: async (_root, { input }: { input: ItemsInput }) => {
        return await getItems(labels, input);
      },

      itemCount: async (_root, { input }: { input: ItemsInput }) => {
        const res = await getItems(labels, input);

        return res.length;
      },

      labels: async (_root, { input }: { input: LabelsInput }) => {
        return await labels.find(getLabelFilter(input))
          .toArray();
      },

      labelCount: (_root, { input }: { input: LabelsInput }) => {
        return labels.count(getLabelFilter(input));
      }
    },

    Label: {
      id: (label: LabelDoc) => label.id,
      itemIds: (label: LabelDoc) => label.itemIds
    },

    Mutation: {
      addLabelsToItem: async (
        _root, { input }: { input: AddLabelsToItemInput },
        context: Context) => {
        const labelIds = _.map(input.labelIds, standardizeLabel);

        const reqIdPendingFilter = { 'pending.reqId': context.reqId };

        const bulkUpdateBaseOps = _.map(labelIds, (labelId) => {
          return {
            updateOne: {
              filter: { id: labelId, pending: { $exists: false } },
              update: {
                $push: { itemIds: input.itemId }
              },
              upsert: true
            }
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
            const result = await labels.bulkWrite(bulkUpdateBaseOps);
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
              _.set(newOp, 'updateOne.update.$push', { itemIds: input.itemId });
              _.set(newOp, 'updateOne.update.$unset', { pending: '' });

              return newOp;
            });

            await labels.bulkWrite(bulkCommitUpdateOps);

            return true;

          case 'abort':
            const bulkAbortUpdateOps = _.map(bulkUpdateBaseOps, (op) => {
              const newOp = _.cloneDeep(op);
              _.set(newOp, 'updateOne.filter', reqIdPendingFilter);
              _.set(newOp, 'updateOne.update.$unset', { pending: '' });

              return newOp;
            });

            await labels.bulkWrite(bulkAbortUpdateOps);

            return true;
        }

        return true;
      },

      createLabel: async (_root, { id }, context: Context) => {
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

            return true;
          case 'abort':
            await labels.deleteOne(reqIdPendingFilter);

            return true;
        }

        return newLabel;
      }
    }
  };
}

const labelCliche: ClicheServer = new ClicheServerBuilder('label')
  .initDb(async (db: mongodb.Db, _config: LabelConfig): Promise<any> => {
    const labels: mongodb.Collection<LabelDoc> = db.collection('labels');
    await labels.createIndex({ id: 1 }, { unique: true, sparse: true });
    await labels.createIndex({ id: 1, itemIds: 1 }, { unique: true });
    if (!_.isEmpty(_config.initialLabelIds)) {
      return labels.insertMany(_.map(_config.initialLabelIds, (id) => {
        return { id: id };
      }));
    }

    return Promise.resolve();
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

labelCliche.start();
