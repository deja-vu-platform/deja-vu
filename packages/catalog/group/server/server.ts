import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

import { graphiqlExpress, graphqlExpress  } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';


interface GroupDoc {
  id: string;
  memberIds: string[];
  subgroupIds: string[];
}

interface MemberDoc {
  id: string;
}

interface GroupsInput {
  withMemberId: string;
  withGroupId: string;
  directOnly: boolean;
  inGroupId: string;
}

interface MembersInput {
  inGroupId: string;
  directOnly: boolean;
}


interface CreateGroupInput {
  id: string | undefined;
  initialMemberIds: string[] | undefined;
  initialSubgroupIds: string[] | undefined;
}

interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'group';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  reinitDbOnStartup: true
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = {...DEFAULT_CONFIG, ...configArg};

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
let db, groups, members;
mongodb.MongoClient.connect(
  `mongodb://${config.dbHost}:${config.dbPort}`, async (err, client) => {
    if (err) {
      throw err;
    }
    db = client.db(config.dbName);
    if (config.reinitDbOnStartup) {
      await db.dropDatabase();
      console.log(`Reinitialized db ${config.dbName}`);
    }
    groups = db.collection('groups');
    groups.createIndex({ id: 1 }, { unique: true, sparse: true });
    members = db.collection('members');
    members.createIndex({ id: 1 }, { unique: true, sparse: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];


// Gets all groups directly containing the member with given id
function getGroupsByDirectMember(id: string): Promise<GroupDoc[]> {
  return groups
    .find({ memberIds: id })
    .toArray();
}

// Gets all groups directly containing the subgroup with given atom_id
function getGroupsByDirectSubgroup(id: string): Promise<GroupDoc[]> {
  return groups
    .find({ subgroupIds: id })
    .toArray();
}

// Recursively explores subgroups of a group with given id
// Calls groupVisitFn on each subgroup
// The root parent group does get visited
function forEachGroupInGroup(
  id: string, groupVisitFn: (group: GroupDoc) => void): Promise<void> {
  const recurse = async (
    id: string, groupVisitFn: (group: GroupDoc) => void,
    visitedGroups: Set<string>) => {
      const group: GroupDoc = await groups.findOne({ id: id });
      groupVisitFn(group);
      const recursiveCalls: Promise<void>[] = [];
      group.subgroupIds.forEach((subgroupId) => {
        if (!visitedGroups.has(subgroupId)) {
          visitedGroups.add(subgroupId);
          recursiveCalls.push(
            recurse(subgroupId, groupVisitFn, visitedGroups));
        }
      });

      await Promise.all(recursiveCalls);
  };

  return recurse(id, groupVisitFn, new Set([id]));
}

// Recursive step for forEachGroupContaining... functions
// Not intended to be used on its own
async function _groupContainingRecurse(
  id: string,
  groupVisitFn: (group: GroupDoc) => void,
  visitedGroups: Set<string>): Promise<void> {
  const groupsWithSubgroup: GroupDoc[] = await groups
    .find({ subgroupsIds: id })
    .toArray();
  const recursiveCalls: Promise<void>[] = [];
  groupsWithSubgroup.forEach(group => {
    if (!visitedGroups.has(group.id)) {
      visitedGroups.add(group.id);
      groupVisitFn(group);
      recursiveCalls.push(
        _groupContainingRecurse(group.id, groupVisitFn, visitedGroups)
      );
    }
  });

  await Promise.all(recursiveCalls);
}

// Recursively explores groups where the group with given id is a subgroup
// Calls groupVisitFn on each group
// The root child subgroup is not visited
function forEachGroupContainingGroup(
  id: string, groupVisitFn: (group: GroupDoc) => void): Promise<void> {
  return _groupContainingRecurse(id, groupVisitFn, new Set([id]));
}

// Recursively explores groups where the group with given id is a member
// Calls groupVisitFn on each group
// The root child subgroup is not visited
async function forEachGroupContainingMember(
  id: string, groupVisitFn: (group: GroupDoc) => void): Promise<void> {
  const visitedGroups: Set<string> = new Set([]);

  const groupsWithMember: GroupDoc[] = await getGroupsByDirectMember(id);
  groupsWithMember.forEach(group => {
    visitedGroups.add(group.id);
    groupVisitFn(group);
  });

  await Promise
    .all(
      groupsWithMember
        .map((group) => _groupContainingRecurse(
          group.id, groupVisitFn, visitedGroups)));
}

// Does an update to add/remove a member/subgroup from a group
async function addOrRemoveMemberOrSubgroup(
  groupId: string,
  childId: string,
  groupField: 'memberIds' | 'subgroupIds',
  operation: '$addToSet' | '$pull'
): Promise<GroupDoc> {
  const queryObj = { id: groupId };
  const updateObj = { [operation]: { [groupField]: childId } };

  const update = await groups.findOneAndUpdate(queryObj, updateObj);

  return update.value;
}


const resolvers = {
  Query: {
    group: (root, { id }) => groups.findOne({ id: id }),
    member: (root, { id }) => members.findOne({ id: id }),
    // Get all members directly or indirectly in a group
    members: async (root, { input }: { input: MembersInput }) =>  {
      let ret;
      if (input.inGroupId && !input.directOnly) {
        const foundMembers: Set<string> = new Set();
        await forEachGroupInGroup(input.inGroupId, (group: GroupDoc) => {
          group.memberIds.forEach((memberId: string) => {
            foundMembers.add(memberId);
          });
        });
        ret = members
          .find({ id: { $in: Array.from(foundMembers) } })
          .toArray();
      } else if (input.inGroupId && input.directOnly) {
        const inGroup: GroupDoc = await groups
          .findOne({ id: input.inGroupId }, { memberIds: 1 });
        ret = _.map(inGroup.memberIds, (memberId) => ({ id: memberId }));
      } else {
        ret = members.find()
          .toArray();
      }

      return ret;
    },
    groups: async (root, { input }: { input: GroupsInput }) => {
      if (input.withGroupId && input.directOnly) {
        return getGroupsByDirectSubgroup(input.withGroupId);
      } else if (input.withGroupId && !input.directOnly) {
        const foundGroups: GroupDoc[] = [];
        await forEachGroupContainingGroup(
          input.withGroupId, (group: GroupDoc) => {
            foundGroups.push(group);
          });

        return foundGroups;
      } else if (input.withMemberId && input.directOnly) {
        return getGroupsByDirectMember(input.withMemberId);
      } else if (input.withMemberId && !input.directOnly) {
        const foundGroups: GroupDoc[] = [];
        await forEachGroupContainingMember(
          input.withMemberId, (group: GroupDoc) => {
            foundGroups.push(group);
          });

        return foundGroups;
      } else if (input.inGroupId && !input.directOnly) {
        const foundSubgroups: GroupDoc[] = [];
        await forEachGroupContainingGroup(
          input.inGroupId, (group: GroupDoc) => {
            if (group.id !== input.inGroupId) {
              foundSubgroups.push(group);
            }
          });

        return foundSubgroups;
      } else if (input.inGroupId && input.directOnly) {
        throw new Error('not supported yet');
      }

      return groups.find()
        .toArray();
    }
  },
  Group: {
    id: (group: GroupDoc) => group.id,
    members: (group: GroupDoc) => members
      .find({ id: {$in: group.memberIds} })
      .toArray(),
    subgroups: (group: GroupDoc) => groups
      .find({ id: {$in: group.subgroupIds} })
      .toArray()
  },
  Member: {
    id: (member: MemberDoc) => member.id
  },
  Mutation: {
    createGroup: (root, { input }: {input: CreateGroupInput}) => {
      const g: GroupDoc = {
        id: input.id ? input.id : uuid(),
        memberIds: input.initialMemberIds ? input.initialMemberIds : [],
        subgroupIds: input.initialSubgroupIds ? input.initialSubgroupIds : []
      };
      groups.insertOne(g);

      return g;
    },
    createMember: (root, { id }) => {
      const m = { id : id ? id : uuid() };
      members.insertOne(m);

      return m;
    },
    addMember: (root, { groupId, id }) => {
      return addOrRemoveMemberOrSubgroup(groupId, id, 'memberIds', '$addToSet');
    },
    removeMember: (root, { groupId, id }) => {
      return addOrRemoveMemberOrSubgroup(groupId, id, 'memberIds', '$pull');
    },
    addSubgroup: (root, { groupId, id }) => {
      return addOrRemoveMemberOrSubgroup(
        groupId, id, 'subgroupIds', '$addToSet');
    },
    removeSubgroup: (root, { groupId, id }) => {
      return addOrRemoveMemberOrSubgroup(groupId, id, 'subgroupIds', '$pull');
    }
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
