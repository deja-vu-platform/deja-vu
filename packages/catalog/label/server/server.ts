import {
  ActionRequestTable,
  ClicheDb,
  ClicheServer,
  ClicheServerBuilder,
  Collection,
  Config,
  Context,
  EMPTY_CONTEXT,
  getReturnFields
} from '@deja-vu/cliche-server';
import * as _ from 'lodash';
import {
  AddLabelsToItemInput,
  ItemsInput,
  LabelDoc,
  LabelsInput
} from './schema';

import { v4 as uuid } from 'uuid';

interface LabelConfig extends Config {
  initialLabelIds: string[];
}

function standardizeLabel(id: string): string {
  return id.trim()
    .toLowerCase();
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
          query SearchItemsByLabel($input: ItemsInput!) {
            items(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'labels':
        return `
          query SearchItemsByLabel($input: LabelsInput!) {
            labels(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'show-items': (extraInfo) => `
    query ShowItems($input: ItemsInput!) {
      items(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-item-count': (extraInfo) => `
    query ShowItemCount($input: ItemsInput!) {
      itemCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-labels': (extraInfo) => `
    query ShowLabels($input: LabelsInput!) {
      labels(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-label-count': (extraInfo) => `
    query ShowLabelCount($input: LabelsInput!) {
      labelCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

function resolvers(db: ClicheDb, _config: LabelConfig): object {
  const labels: Collection<LabelDoc> = db.collection('labels');

  return {
    Query: {
      label: async (_root, { id }) =>
        await labels.findOne({ id : standardizeLabel(id)}),

      items: async (_root, { input }: { input: ItemsInput }) => {
        const matchQuery = {};
        const groupQuery = { _id: 0, itemIds: { $push: '$itemIds' } };
        const reduceOperator = {};
        let initialValue;

        if (input.labelIds) {
          // Items matching all labelIds
          const standardizedLabelIds = _.map(input.labelIds, standardizeLabel);
          matchQuery['id'] = { $in: standardizedLabelIds };
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

        return res[0] ? res[0].itemIds : [];
      },

      labels: async (_root, { input }: { input: LabelsInput }) => {
        const query = {};
        if (input.itemId) {
          // Labels of an item
          query['itemIds'] = input.itemId;
        }

        return labels.find(query);
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
        const updateOp = { $push: { itemIds: input.itemId } };
        const errors = await Promise.all(_.map(labelIds, async (id) => {
          try {
            // cannot use updateMany because we need to upsert labels
            await labels.updateOne(context, { id }, updateOp, { upsert: true });

            return undefined;
          } catch (err) {
            console.error(err);

            return err;
          }
        }));
        if (errors.filter((err) => !!err).length === 0) {
          return true;
        }
        const errMsg = _.reduce(errors, (prev, curr, index) => {
          if (!curr) {
            return prev;
          }
          const delimiter = index ? ', ' : '';

          return `${prev}${delimiter}${labelIds[index]}`;
        }, 'Could not add the following labels to the item: ');
        throw new Error(errMsg);
      },

      createLabel: async (_root, { id }, context: Context) => {
        const labelId = id ? standardizeLabel(id) : uuid();
        const newLabel: LabelDoc = { id: labelId };

        return await labels.insertOne(context, newLabel);
      }
    }
  };
}

const labelCliche: ClicheServer = new ClicheServerBuilder('label')
  .initDb(async (db: ClicheDb, config: LabelConfig): Promise<any> => {
    const labels: Collection<LabelDoc> = db.collection('labels');
    await labels.createIndex({ id: 1 }, { unique: true, sparse: true });
    await labels.createIndex({ id: 1, itemIds: 1 }, { unique: true });
    if (!_.isEmpty(config.initialLabelIds)) {
      return labels.insertMany(EMPTY_CONTEXT,
        _.map(config.initialLabelIds, (id) => ({ id: id })));
    }

    return Promise.resolve();
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

labelCliche.start();
