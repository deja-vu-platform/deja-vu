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
}

interface GroupsInput {
  withMemberId: string;
}

interface MembersInput {
  inGroupId: string;
}

interface CreateGroupInput {
  id: string | undefined;
  initialMemberIds: string[] | undefined;
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
let db: mongodb.Db, groups: mongodb.Collection<GroupDoc>;
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
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];


async function addOrRemoveMember(
  groupId: string, memberId: string, operation: '$addToSet' | '$pull')
  : Promise<GroupDoc> {
  const updateObj = { [operation]: { memberIds: memberId } };
  const update = await groups.findOneAndUpdate({ id: groupId }, updateObj);
  if (_.isNil(update.value)) {
    throw new Error(`Group ${groupId} not found`);
  }

  return update.value!;
}


const resolvers = {
  Query: {
    group: (root, { id }) => groups.findOne({ id: id }),
    members: async (root, { input }: { input: MembersInput }) =>  {
      const filter = input.inGroupId ? { id: input.inGroupId } : {};

      return groups.aggregate([
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
      ])
      .toArray();
    },
    groups: async (root, { input }: { input: GroupsInput }) => {
      const filter = input.withMemberId ?
        { memberIds: input.withMemberId } : {};

      return groups.find(filter)
        .toArray();
    }
  },
  Group: {
    id: (group: GroupDoc) => group.id,
    memberIds: (group: GroupDoc) => group.memberIds
  },
  Mutation: {
    createGroup: (root, { input }: {input: CreateGroupInput}) => {
      const g: GroupDoc = {
        id: input.id ? input.id : uuid(),
        memberIds: input.initialMemberIds ? input.initialMemberIds : []
      };
      groups.insertOne(g);

      return g;
    },
    addMember: (root, { groupId, id }) => addOrRemoveMember(
      groupId, id, '$addToSet'),
    removeMember: (root, { groupId, id }) => addOrRemoveMember(
      groupId, id, '$pull')
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
