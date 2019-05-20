import {
  ActionRequestTable,
  ClicheDb,
  ClicheServer,
  ClicheServerBuilder,
  Collection,
  Context,
  EMPTY_CONTEXT,
  getReturnFields
} from '@deja-vu/cliche-server';
import * as Ajv from 'ajv';
import { IResolvers } from 'graphql-tools';
import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
import {
  jsonSchemaTypeToGraphQlType,
  PropertyConfig
} from './config-types';
import { ObjectDoc } from './schema';

const loadSchemaQuery = (extraInfo) => `
  query Properties {
    properties ${getReturnFields(extraInfo)}
  }
`;
const loadSchemaAndObjectsQueries = (extraInfo) => {
  switch (extraInfo.action) {
    case 'properties':
      return loadSchemaQuery(extraInfo);
    case 'objects':
      return `
        query Objects {
          objects ${getReturnFields(extraInfo)}
        }
      `;
    default:
      throw new Error('Need to specify extraInfo.action');
  }
};


const actionRequestTable: ActionRequestTable = {
  'choose-object': (extraInfo) => loadSchemaAndObjectsQueries(extraInfo),
  'create-object': (extraInfo) => {
    switch (extraInfo.action) {
      case 'schema':
        return loadSchemaQuery(extraInfo);
      case 'create':
        return `
          mutation CreateObject($input: CreateObjectInput!) {
            createObject(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'create-objects': (extraInfo) => {
    switch (extraInfo.action) {
      case 'schema':
        return loadSchemaQuery(extraInfo);
      case 'create':
        return `
          mutation CreateObjects($input: [CreateObjectInput!]!) {
            createObjects(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'create-property': (extraInfo) => `
    query Property($name: String!) {
      property(name: $name) ${getReturnFields(extraInfo)}
    }
  `,
  'object-autocomplete': (extraInfo) => loadSchemaAndObjectsQueries(extraInfo),
  'show-object': (extraInfo) => {
    switch (extraInfo.action) {
      case 'properties':
        return loadSchemaQuery(extraInfo);
      case 'object':
        return `
          query ShowObject($id: ID!) {
            object(id: $id) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'show-objects': (extraInfo) => loadSchemaAndObjectsQueries(extraInfo)
};

function getDynamicTypeDefs(config: PropertyConfig): string[] {
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

  return [`
    type Object {
      id: ID!
      ${joinedProperties}
    }

    input CreateObjectInput {
      id: ID
      ${joinedProperties}
    }
  `];
}

function createObjectFromInput(config: PropertyConfig, input) {
  const newObject = input;
  newObject.id = input.id ? input.id : uuid();
  const ajv = new Ajv();
  const validate = ajv.compile(config.schema);
  const valid = validate(_.omit(newObject, 'id'));
  if (!valid) {
    throw new Error(_.map(validate.errors, 'message')
      .join('\n'));
  }

  return newObject;
}

function resolvers(db: ClicheDb, config: PropertyConfig): IResolvers {
  const objects: Collection<ObjectDoc> = db.collection('objects');
  const resolversObj = {
    Query: {
      property: (_root, { name }) => {
        const propertyInfo = config.schema.properties[name];

        return {
          name: name,
          schema: JSON.stringify(propertyInfo),
          required: _.includes(config.schema.required, name)
        };
      },
      object: async (_root, { id }) => {
        const obj: ObjectDoc | null = await objects.findOne({ id: id });

        return _.get(obj, '_pending') ? null : obj;
      },
      objects: (_root) => objects.find(),
      properties: (_root) => _
        .chain(config['schema'].properties)
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
      createObject: async (_root, { input }, context: Context) => {
        const newObject: ObjectDoc = createObjectFromInput(config, input);

        return await objects.insertOne(context, newObject);
      },

      createObjects: async (_root, { input }, context: Context) => {
        const objDocs: ObjectDoc[] = _.map(
          input, (i) => createObjectFromInput(config, i));
        _.each(objDocs, (objDoc: ObjectDoc) => {
          objDoc._pending = { reqId: context.reqId };
        });

        return await objects.insertMany(context, objDocs);
      }
    }
  };
  const objectResolvers = {
    id: (obj) => obj.id
  };
  for (const propertyName of _.keys(config.schema.properties)) {
    objectResolvers[propertyName] = (obj) => obj[propertyName];
  }
  resolversObj['Object'] = objectResolvers;

  return resolversObj;
}

const propertyCliche: ClicheServer<PropertyConfig> =
  new ClicheServerBuilder<PropertyConfig>('property')
    .initDb(async (db: ClicheDb, config: PropertyConfig): Promise<any> => {
      const objects: Collection<ObjectDoc> = db.collection('objects');
      await objects.createIndex({ id: 1 }, { unique: true, sparse: true });
      if (!_.isEmpty(config.initialObjects)) {
        return objects.insertMany(EMPTY_CONTEXT,
          _.map(config.initialObjects, (obj) => {
            obj['id'] = obj['id'] ? obj['id'] : uuid();

            return obj;
          })
        );
      }

      return Promise.resolve();
    })
    .actionRequestTable(actionRequestTable)
    .resolvers(resolvers)
    .dynamicTypeDefs(getDynamicTypeDefs)
    .build();

propertyCliche.start();
