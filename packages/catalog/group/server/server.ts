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
import {
  CreateGroupInput,
  GroupDoc,
  GroupsInput,
  MembersInput
} from './schema';

import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';


const actionRequestTable: ActionRequestTable = {
  'add-to-group': (extraInfo) => `
    mutation AddToGroup($groupId: ID!, $id: ID!) {
      addMember(groupId: $groupId, id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'create-group': (extraInfo) => `
    mutation CreateGroup($input: CreateGroupInput!) {
      createGroup (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-group': (extraInfo) => `
    mutation DeleteGroup($id: ID!) {
      deleteGroup (id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'join-leave': (extraInfo) => {
    switch (extraInfo.action) {
      case 'join':
        return `
          mutation JoinGroup($groupId: ID!, $id: ID!) {
            addMember(groupId: $groupId, id: $id) ${getReturnFields(extraInfo)}
          }
        `;
      case 'leave':
        return `
          mutation LeaveGroup($groupId: ID!, $id: ID!) {
            removeMember(groupId: $groupId, id: $id)
              ${getReturnFields(extraInfo)}
          }
        `;
      case 'is-in-group':
        return `
          query JoinLeave($id: ID!) {
            group(id: $id) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'show-groups': (extraInfo) => `
    query ShowGroups($input: GroupsInput!) {
      groups(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-group-count': (extraInfo) => `
    query ShowGroupCount($input: GroupsInput!) {
      groupCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-members': (extraInfo) => `
    query ShowMembers($input: MembersInput!) {
      members(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-member-count': (extraInfo) => `
    query ShowMemberCount($input: MembersInput!) {
      memberCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

function getGroupFilter(input: GroupsInput) {
  const noCreateGroupPending = {
    $or: [
      { pending: { $exists: false } },
      { pending: { type: { $ne: 'create-group' } } }
    ]
  };

  const filter = (!_.isNil(input) && !_.isNil(input.withMemberId)) ?
    { $and: [{ memberIds: input.withMemberId }, noCreateGroupPending] } :
    noCreateGroupPending;

  return filter;
}

function getMemberAggregationPipeline(input: MembersInput,
  getCount = false) {
  const noCreateGroupPending = {
    $or: [
      { pending: { $exists: false } },
      { pending: { type: { $ne: 'create-group' } } }
    ]
  };
  const filter = (!_.isNil(input) && !_.isNil(input.inGroupId)) ?
    { $and: [{ id: input.inGroupId }, noCreateGroupPending] } :
    noCreateGroupPending;

  const pipeline: any = [
    { $match: filter },
    {
      $group: {
        _id: 0,
        memberIds: { $push: '$memberIds' }
      }
    },
    {
      $project: {
        memberIds: {
          $reduce: {
            input: '$memberIds',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] }
          }
        }
      }
    }
  ];

  if (getCount) {
    pipeline.push({ $project: { count: { $size: '$memberIds' } } });
  }

  return pipeline;
}

async function getMembers(groups: Collection<GroupDoc>,
  input: MembersInput) {

  const res = await groups
    .aggregate(getMemberAggregationPipeline(input))
    .toArray();

  return res[0] ? res[0].memberIds : [];
}

async function getMemberCount(groups: Collection<GroupDoc>,
  input: MembersInput) {
  const res = await groups
    .aggregate(getMemberAggregationPipeline(input, true))
    .next();

  return res ? res['count'] : 0;
}

async function addOrRemoveMember(
  groups: Collection<GroupDoc>, groupId: string, memberId: string,
  updateType: 'add-member' | 'remove-member',
  context: Context): Promise<Boolean> {
  const operation = updateType === 'add-member' ? '$addToSet' : '$pull';
  const updateOp = { [operation]: { memberIds: memberId } };

  return await groups.updateOne(context, { id: groupId }, updateOp);
}


function resolvers(db: ClicheDb, _config: Config): object {
  const groups: Collection<GroupDoc> = db.collection('groups');

  return {
    Query: {
      group: async (_root, { id }) => await groups.findOne({ id: id }),

      members: async (_root, { input }: { input: MembersInput }) => {
        return await getMembers(groups, input);
      },

      groups: async (_root, { input }: { input: GroupsInput }) => {
        return await groups.find(getGroupFilter(input));
      },

      groupCount: (_root, { input }: { input: GroupsInput }) => {
        return groups.countDocuments(getGroupFilter(input));
      },

      memberCount:  async (_root, { input }: { input: MembersInput }) => {
        return getMemberCount(groups, input);
      }
    },
    Group: {
      id: (group: GroupDoc) => group.id,
      memberIds: (group: GroupDoc) => group.memberIds
    },
    Mutation: {
      createGroup: async (
        _root, { input }: { input: CreateGroupInput }, context: Context) => {
        const g: GroupDoc = {
          id: input.id ? input.id : uuid(),
          memberIds: input.initialMemberIds ? input.initialMemberIds : []
        };

        return await groups.insertOne(context, g);
      },
      addMember: (_root, { groupId, id }, context: Context) =>
        addOrRemoveMember(groups, groupId, id, 'add-member', context),

      removeMember: (_root, { groupId, id }, context: Context) =>
        addOrRemoveMember(groups, groupId, id, 'remove-member', context),

      deleteGroup: async (_root, { id }, context: Context) => {
        return await groups.deleteOne(context, { id: id });
      }
    }
  };
}

const groupCliche: ClicheServer = new ClicheServerBuilder('group')
  .initDb((db: ClicheDb, _config: Config): Promise<any> => {
    const groups: Collection<GroupDoc> = db.collection('groups');

    return groups.createIndex({ id: 1 }, { unique: true, sparse: true });
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

groupCliche.start();
