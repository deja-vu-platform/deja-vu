import * as commandLineArgs from 'command-line-args';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongodb from 'mongodb';

const { graphqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');


interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
}

const opts = commandLineArgs([
  {name: 'as', type: String},
  {name: 'config', type: String}
]);

const name = opts.as ? opts.as : 'this-cliche-name';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`
};

const config: Config = {...DEFAULT_CONFIG, ...JSON.parse(opts.config)};


const server = new mongodb.Server(
  config.dbHost, config.dbPort,
  {socketOptions: {autoReconnect: true}});
const db = new mongodb.Db(config.dbName, server, {w: 1});

const typeDefs = `
  type Principal { atomId: String  }
  type Resource { atomId: String, owner: Principal, viewers: [Principal] }

  type Query { principals: [Principal] }
`;

const resolvers = {
    Query: { principals: () => db.collection('principals').find() },
    Principal: {
        atomId: principal => principal.atomId
    },
    Resource: {
        atomId: r => r.atomId, owner: r => r.owner,
        viewers: r => {
          let ids = [];
          if (r.viewers) {
              ids = r.viewers.map(viewer => viewer.atomId);
          }
          return db.collection('principal')
              .find({ atom_id: { $in: ids } })
              .toArray();
        }
    }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

app.listen(config.wsPort, () => {
    console.log(`Running ${name}`);
});
