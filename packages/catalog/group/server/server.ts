import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

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
): Promise<boolean> {
  const queryObj = { id: groupId };
  const updateObj = { [operation]: { [groupField]: childId } };

  const update = await groups.updateOne(queryObj, updateObj);

  return update.modifiedCount > 0;
}


const resolvers = {
  Query: {
    group: (root, { id }) => groups.findOne({ id: id }),
    member: (root, { id }) => members.findOne({ id: id }),
    // Get all members directly or indirectly in a group
    allMembers: async (root, { id }) =>  {
      const foundMembers: Set<string> = new Set();
      await forEachGroupInGroup(id, (group: GroupDoc) => {
        group.memberIds.forEach((memberId: string) => {
          foundMembers.add(memberId);
        });
      });

      return members
        .find({ id: { $in: Array.from(foundMembers) } })
        .toArray();
    },
    // Get all subgroups directly or indirectly in a group
    allSubgroups: async (root, { id }) => {
      const foundSubgroups: GroupDoc[] = [];
      await forEachGroupInGroup(id, (group: GroupDoc) => {
        if (group.id !== id) {
          foundSubgroups.push(group);
        }
      });

      return foundSubgroups;
    },
    // Get all groups directly containing a member
    groupsByDirectMember: (root, { id }) => getGroupsByDirectMember(id),
    // Get all groups directly containing a subgroup
    groupsByDirectSubgroup: (root, { id }) => getGroupsByDirectSubgroup(id),
    // Get all groups directly or indirectly containing a member
    groupsByMember: async (root, { id }) => {
      const foundGroups: GroupDoc[] = [];
      await forEachGroupContainingMember(id, (group: GroupDoc) => {
        foundGroups.push(group);
      });

      return foundGroups;
    },
    // Get all groups directly or indirectly containing a subgroup
    groupsBySubgroup: async (root, { id }) => {
      const foundSubgroups: GroupDoc[] = [];

      await forEachGroupContainingGroup(id, (group: GroupDoc) => {
        foundSubgroups.push(group);
      });

      return foundSubgroups;
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
    createGroup: (root, { id, initialMemberIds, initialSubgroupIds }) => {
      const g: GroupDoc = {
        id: id ? id : uuid(),
        memberIds: initialMemberIds,
        subgroupIds: initialSubgroupIds
      };
      groups.insertOne(g);

      return g;
    },
    createMember: (root, { id }) => {
      const m = { id : id ? id : uuid() };
      members.insertOne(m);

      return m;
    },
    addMember: (root, { groupId, memberId }) => {
      return addOrRemoveMemberOrSubgroup(
        groupId, memberId, 'memberIds', '$addToSet');
    },
    removeMember: (root, { groupId, memberId }) => {
      return addOrRemoveMemberOrSubgroup(
        groupId, memberId, 'memberIds', '$pull');
    },
    addSubgroup: (root, { groupId, subgroupId }) => {
      return addOrRemoveMemberOrSubgroup(
        groupId, subgroupId, 'subgroupIds', '$addToSet');
    },
    removeSubgroup: (root, { groupId, subgroupId }) => {
      return addOrRemoveMemberOrSubgroup(
        groupId, subgroupId, 'subgroupIds', '$pull');
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
