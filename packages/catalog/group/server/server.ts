import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

// GitHub Issue: https://github.com/apollographql/apollo-server/issues/927
// tslint:disable-next-line:no-var-requires
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');
import { makeExecutableSchema } from 'graphql-tools';


interface GroupDoc {
  id: string;
  memberIds: string[];
  pending?: PendingDoc;
}

interface PendingDoc {
  reqId: string;
  type: 'create-group' | 'add-member' | 'remove-member';
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

const CONCURRENT_UPDATE_ERROR = 'An error has occurred. Please try again later';

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

class Validation {
  static async groupExistsOrFail(id: string): Promise<void> {
    const group: GroupDoc | null = await groups.findOne(
      { id: id }, { projection: { _id: 1 } });
    if (group === null) {
      throw new Error(`Group ${id} doesn't exist`);
    }
  }
}


interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

function isPendingCreate(group: GroupDoc | null) {
  return _.get(group, 'pending.type') === 'create-group';
}

async function addOrRemoveMember(groupId: string, memberId: string,
  updateType: 'add-member' | 'remove-member', context: Context)
  : Promise<Boolean> {
  const operation = updateType === 'add-member' ? '$addToSet' : '$pull';
  const updateOp = { [operation]: { memberIds: memberId } };

  const notPendingGroupFilter = {
    id: groupId,
    pending: { $exists: false }
  };
  const reqIdPendingFilter = { 'pending.reqId': context.reqId };
  switch (context.reqType) {
    case 'vote':
      await Validation.groupExistsOrFail(groupId);
      const pendingUpdateObj = await groups.updateOne(
        notPendingGroupFilter,
        {
          $set: {
            pending: {
              reqId: context.reqId,
              type: updateType
            }
          }
        });
      if (pendingUpdateObj.matchedCount === 0) {
        throw new Error(CONCURRENT_UPDATE_ERROR);
      }

      return true;
    case undefined:
      await Validation.groupExistsOrFail(groupId);
      const updateObj = await groups.updateOne(notPendingGroupFilter, updateOp);
      if (updateObj.matchedCount === 0) {
        throw new Error(CONCURRENT_UPDATE_ERROR);
      }

      return true;
    case 'commit':
      await groups.updateOne(
        reqIdPendingFilter,
        { ...updateOp, $unset: { pending: '' } });

      return false;
    case 'abort':
      await groups.updateOne(reqIdPendingFilter, { $unset: { pending: '' } });

      return false;
  }

  return false;
}


const resolvers = {
  Query: {
    group: async (root, { id }) => {
      const group: GroupDoc | null = await groups.findOne({ id: id });

      return isPendingCreate(group) ? null : group;
    },
    members: async (root, { input }: { input: MembersInput }) =>  {
      const noCreateGroupPending =  {
        $or: [
          { pending: { $exists: false } },
          { pending: { type: { $ne: 'create-group' } } }
        ]
      };
      const filter = input.inGroupId ?
        { $and: [ { id: input.inGroupId }, noCreateGroupPending ] } :
        noCreateGroupPending;

      const pipelineResults = await groups.aggregate([
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

      const matchingMembers = _.get(pipelineResults[0], 'memberIds', []);

      return matchingMembers;
    },
    groups: async (root, { input }: { input: GroupsInput }) => {
      const filter = input.withMemberId ?
        { memberIds: input.withMemberId } : {};
      filter['pending'] = { type: { $ne: 'create-group' } };

      return groups.find(filter)
        .toArray();
    }
  },
  Group: {
    id: (group: GroupDoc) => group.id,
    memberIds: (group: GroupDoc) => group.memberIds
  },
  Mutation: {
    createGroup: async (
      root, { input }: {input: CreateGroupInput}, context: Context) => {
      const g: GroupDoc = {
        id: input.id ? input.id : uuid(),
        memberIds: input.initialMemberIds ? input.initialMemberIds : []
      };
      const reqIdPendingFilter = { 'pending.reqId': context.reqId };
      switch (context.reqType) {
        case 'vote':
          g.pending = { reqId: context.reqId, type: 'create-group' };
        case undefined:
          await groups.insertOne(g);
          return g;
        case 'commit':
          await groups.updateOne(
            reqIdPendingFilter,
            { $unset: { pending: '' } });
          return;
        case 'abort':
          await groups.deleteOne(reqIdPendingFilter);
          return;
      }

      return g;
    },
    addMember: (root, { groupId, id }, context: Context) => addOrRemoveMember(
      groupId, id, 'add-member', context),
    removeMember: (root, { groupId, id }, context: Context) => addOrRemoveMember(
      groupId, id, 'remove-member', context)
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.post(/^\/dv\/(.*)\/(vote|commit|abort)\/.*/,
  (req, res, next) => {
    req['reqId'] = req.params[0];
    req['reqType'] = req.params[1];
    next();
  },
  bodyParser.json(),
  graphqlExpress((req) => {
    return {
      schema: schema,
      context: {
        reqType: req!['reqType'],
        reqId: req!['reqId']
      },
      formatResponse: (gqlResp) => {
        const reqType = req!['reqType'];
        switch (reqType) {
          case 'vote':
            return {
              result: (gqlResp.errors) ? 'no' : 'yes',
              payload: gqlResp
            };
          case 'abort':
          case 'commit':
            return 'ACK';
          case undefined:
            return gqlResp;
        }
      }
    };
  })
);

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
