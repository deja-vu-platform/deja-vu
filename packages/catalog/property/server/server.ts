import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import { graphiqlExpress, graphqlExpress  } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';

import * as _ from 'lodash';

import * as Ajv from 'ajv';


interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
  schema: any;
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'property';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  reinitDbOnStartup: true,
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

let db, objects;
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


const resolvers = {
  Query: {
    property: (root, { name }) => {
      const propertyInfo = config.schema.properties[name];

      return {
        name: name,
        schema: JSON.stringify(propertyInfo),
        required: _.includes(config.schema.required, name),
        graphQlType: jsonSchemaTypeToGraphQlType[propertyInfo.type]
      };
    },
    object: (root, { id }) => objects.findOne({ id: id }),
    properties: (root) => _
      .chain(config.schema.properties)
      .toPairs()
      .map(([ name, propertyInfo ]) => ({
        name: name,
        schema: JSON.stringify(propertyInfo),
        required: _.includes(config.schema.required, name),
        graphQlType: jsonSchemaTypeToGraphQlType[propertyInfo.type]
      }))
      .value()
  },
  Property: {
    name: (root) => root.name,
    schema: (root) => root.schema,
    required: (root) => root.required,
    graphQlType: (root) => root.graphQlType
  },
  Mutation: {
    createObject: async (root, { input }) => {
      const newObject = input;
      newObject.id = input.id ? input.id : uuid();
      const ajv = new Ajv();
      const validate = ajv.compile(config.schema);
      console.log(_.omit(newObject, 'id'));
      const valid = validate(_.omit(newObject, 'id'));
      if (!valid) {
        throw new Error(_.map(validate.errors, (error) => error.message));
      }
      await objects.insertOne(newObject);

      return newObject;
    }
  }
};

const objectResolvers = {};
for (const propertyName of _.keys(config.schema.properties)) {
  objectResolvers[propertyName] = (obj) => obj[propertyName];
}
resolvers['Object'] = objectResolvers;

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
