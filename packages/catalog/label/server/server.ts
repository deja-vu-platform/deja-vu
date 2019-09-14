import {
  Collection,
  ComponentRequestTable,
  ConceptDb,
  ConceptServer,
  ConceptServerBuilder,
  Config,
  Context,
  EMPTY_CONTEXT,
  getReturnFields
} from '@deja-vu/concept-server';
import { IResolvers } from 'graphql-tools';
import * as _ from 'lodash';
import {
  AddLabelsToItemInput,
  ItemsInput,
  LabelDoc,
  LabelsInput,
  SetLabelsOfItemInput
} from './schema';

import { v4 as uuid } from 'uuid';

interface LabelConfig extends Config {
  initialLabelIds: string[];
}

function standardizeLabel(id: string): string {
  return id.trim()
    .toLowerCase();
}

const componentRequestTable: ComponentRequestTable = {
  'attach-labels': (extraInfo) => `
    mutation AttachLabels($input: AddLabelsToItemInput!) {
      addLabelsToItem(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'set-labels': (extraInfo) => `
    mutation SetLabels($input: SetLabelsOfItemInput!) {
      setLabelsOfItem(input: $input) ${getReturnFields(extraInfo)}
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

function getLabelFilter(input: LabelsInput) {
  const filter = { pending: { $exists: false } };
  if (!_.isNil(input) && !_.isNil(input.itemId)) {
    // Labels of an item
    filter['itemIds'] = input.itemId;
  }

  return filter;
}

function getItemAggregationPipeline(input: ItemsInput, getCount = false) {
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

  const pipeline: any = [
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
  ];

  if (getCount) {
    pipeline.push({ $project: { count: { $size: '$itemIds' } } });
  }

  return pipeline;
}

async function attachLabels(
  itemId: string, labelIds: string[], labels, context) {
  const standardLabelIds = _.map(labelIds, standardizeLabel);
  const updateOp = { $push: { itemIds: itemId } };
  const errors = await Promise.all(_.map(standardLabelIds, async (id) => {
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

    return `${prev}${delimiter}${standardLabelIds[index]}`;
  }, 'Could not add the following labels to the item: ');
  throw new Error(errMsg);
}


function resolvers(db: ConceptDb, _config: LabelConfig): IResolvers {
  const labels: Collection<LabelDoc> = db.collection('labels');

  return {
    Query: {
      label: async (_root, { id }) =>
        await labels.findOne({ id: standardizeLabel(id) }),

      items: async (_root, { input }: { input: ItemsInput }) => {
        const res = await labels
          .aggregate(getItemAggregationPipeline(input))
          .toArray();

        return res[0] ? res[0].itemIds : [];
      },

      itemCount: async (_root, { input }: { input: ItemsInput }) => {
        const res = await labels
          .aggregate(getItemAggregationPipeline(input, true))
          .next();

        return res ? res['count'] : 0;
      },

      labels: async (_root, { input }: { input: LabelsInput }) => {
        return await labels.find(getLabelFilter(input));
      },

      labelCount: (_root, { input }: { input: LabelsInput }) => {
        return labels.countDocuments(getLabelFilter(input));
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
        await attachLabels(input.itemId, input.labelIds, labels, context);
      },

      setLabelsOfItem: async (
        _root, { input }: { input: SetLabelsOfItemInput },
        context: Context) => {
        const currentLabels = await labels.find({ itemIds: input.itemId });
        const currentLabelSet = new Set(_.map(currentLabels, 'id'));
        const inputLabelSet = new Set(input.labelIds);
        const labelsToRemove = [];
        const labelsToAdd = [];
        for (const labelId of input.labelIds) {
          if (!currentLabelSet.has(labelId)) {
            labelsToAdd.push(labelId);
          }
        }
        currentLabelSet.forEach((currentLabelId: string) => {
          if (!inputLabelSet.has(currentLabelId)) {
            labelsToRemove.push(currentLabelId);
          }
        });

        await db.inTransaction(async () => {
          if (!_.isEmpty(labelsToRemove)) {
            await labels.updateMany(
              context,
              { id: { $in: labelsToRemove } },
              { $pull: { itemIds: input.itemId } });
            console.log('Done deleting item');
          }
          if (!_.isEmpty(labelsToAdd)) {
            await attachLabels(input.itemId, labelsToAdd, labels, context);
            console.log('Done attaching item');
          }
        });
      },

      createLabel: async (_root, { id }, context: Context) => {
        const labelId = id ? standardizeLabel(id) : uuid();
        const newLabel: LabelDoc = { id: labelId };

        return await labels.insertOne(context, newLabel);
      }
    }
  };
}

const labelConcept: ConceptServer = new ConceptServerBuilder('label')
  .initDb(async (db: ConceptDb, config: LabelConfig): Promise<any> => {
    const labels: Collection<LabelDoc> = db.collection('labels');
    await labels.createIndex({ id: 1 }, { unique: true, sparse: true });
    await labels.createIndex({ id: 1, itemIds: 1 }, { unique: true });
    if (!_.isEmpty(config.initialLabelIds)) {
      return labels.insertMany(EMPTY_CONTEXT,
        _.map(config.initialLabelIds, (id) => ({ id: id })));
    }

    return Promise.resolve();
  })
  .componentRequestTable(componentRequestTable)
  .resolvers(resolvers)
  .build();

labelConcept.start();
