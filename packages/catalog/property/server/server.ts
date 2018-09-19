import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

// GitHub Issue: https://github.com/apollographql/apollo-server/issues/927
// tslint:disable-next-line:no-var-requires
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');
import { makeExecutableSchema } from 'graphql-tools';

import * as _ from 'lodash';

import * as Ajv from 'ajv';


interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
  initialObjects: Object[];
  schema: any;
}

interface Pending {
  _pending?: PendingDoc;
}

interface ObjectDoc extends Pending {
  [field: string]: any;
}

interface PendingDoc {
  reqId: string;
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'property';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  reinitDbOnStartup: true,
  initialObjects: [],
  schema: {}
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = {...DEFAULT_CONFIG, ...configArg};

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);

let db: mongodb.Db, objects: mongodb.Collection<ObjectDoc>;
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
    objects = db.collection('objects');
    objects.createIndex({ id: 1 }, { unique: true, sparse: true });
    if (!_.isEmpty(config.initialObjects)) {
      objects.insertMany(_.map(config.initialObjects, (obj) => {
        obj.id = obj.id ? obj.id : uuid();

        return obj;
      }));
    }
  });

const jsonSchemaTypeToGraphQlType = {
  integer: 'Int',
  number: 'Float',
  string: 'String',
  boolean: 'Boolean'
  /* Not supported yet: object, array, null */
};
const requiredProperties: Set<string> = new Set(config.schema.required);
const properties = _
  .chain(config.schema.properties)
  .toPairs()
  .map(([propertyName, schemaPropertyObject]) => {
    return `${propertyName}: ` +
      jsonSchemaTypeToGraphQlType[schemaPropertyObject.type] +
      (requiredProperties.has(propertyName) ? '!' : '');
  })
  .value();

const joinedProperties = properties.join('\n');

const dynamicTypeDefs = [`
  type Object {
    id: ID!
    ${joinedProperties}
  }

  input CreateObjectInput {
    id: ID
    ${joinedProperties}
  }
`];

const typeDefs = [
  readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8'),
  ...dynamicTypeDefs
];

function createObjectFromInput(input) {
  const newObject = input;
  newObject.id = input.id ? input.id : uuid();
  const ajv = new Ajv();
  const validate = ajv.compile(config.schema);
  const valid = validate(_.omit(newObject, 'id'));
  if (!valid) {
    throw new Error(_.map(validate.errors, (error) => error.message));
  }

  return newObject;
}

interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

const resolvers = {
  Query: {
    property: (root, { name }) => {
      const propertyInfo = config.schema.properties[name];

      return {
        name: name,
        schema: JSON.stringify(propertyInfo),
        required: _.includes(config.schema.required, name)
      };
    },
    object: async (root, { id }) => {
      const obj: ObjectDoc | null = await objects.findOne({ id: id });

      return _.get(obj, '_pending') ? null : obj;
    },
    objects: (root) => objects.find({ _pending: { $exists: false } })
      .toArray(),
    properties: (root) => _
      .chain(config.schema.properties)
      .toPairs()
      .map(([ name, propertyInfo ]) => ({
        name: name,
        schema: JSON.stringify(propertyInfo),
        required: _.includes(config.schema.required, name)
      }))
      .value()
  },
  Property: {
    name: (root) => root.name,
    schema: (root) => root.schema,
    required: (root) => root.required
  },
  Mutation: {
    createObject: async (root, { input }, context: Context) => {
      const newObject: ObjectDoc = createObjectFromInput(input);
      const reqIdPendingFilter = { '_pending.reqId': context.reqId };
      switch (context.reqType) {
        case 'vote':
          newObject._pending = { reqId: context.reqId };
          /* falls through */
        case undefined:
          await objects.insertOne(newObject);

          return newObject;
        case 'commit':
          await objects.updateOne(
            reqIdPendingFilter, { $unset: { _pending: '' } });

          return;
        case 'abort':
          await objects.deleteOne(reqIdPendingFilter);

          return;
      }
    },

    createObjects: async (root, { input }, context: Context) => {
      const objDocs: ObjectDoc[] = _.map(input, createObjectFromInput);
      const reqIdPendingFilter = { '_pending.reqId': context.reqId };
      switch (context.reqType) {
        case 'vote':
          _.each(objDocs, (objDoc: ObjectDoc) => {
            objDoc._pending = { reqId: context.reqId };
          });
          /* falls through */
        case undefined:
          await objects.insertMany(objDocs);

          return objDocs;
        case 'commit':
          await objects.updateMany(
            reqIdPendingFilter, { $unset: { _pending: '' } });

          return;
        case 'abort':
          await objects.deleteMany(reqIdPendingFilter);

          return;
      }
    }
  }
};

const objectResolvers = {
  id: (obj) => obj.id
};
for (const propertyName of _.keys(config.schema.properties)) {
  objectResolvers[propertyName] = (obj) => obj[propertyName];
}
resolvers['Object'] = objectResolvers;

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
