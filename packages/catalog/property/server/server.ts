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
  jsonSchemaTypeToGraphQlFilterType,
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
  'update-object': (extraInfo) => {
    switch (extraInfo.action) {
      case 'update':
        return `
          mutation UpdateObject($input: UpdateObjectInput!) {
            updateObject(input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('extraInfo.action can only be update');
    }
  },
  'create-property': (extraInfo) => `
    query Property($name: String!) {
      property(name: $name) ${getReturnFields(extraInfo)}
    }
  `,
  'filter-objects': (extraInfo) => `
    query FilteredObjects($filters: FilterInput) {
      filteredObjects(filters: $filters) ${getReturnFields(extraInfo)},
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
  'show-objects': (extraInfo) => {
    switch (extraInfo.action) {
      case 'properties':
        return loadSchemaQuery(extraInfo);
      case 'objects':
        return `
          query ShowObjects($fields: FieldMatchingInput) {
            objects(fields: $fields) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'remove-object': (extraInfo) => `
    mutation RemoveObject($id: ID!) {
      removeObject(id: $id) ${getReturnFields(extraInfo)}
    }
  `
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

  // Similar as properties, but it doesn't mark any field as required
  // this is used as a filter mechanism where not all fields must present
  const nonRequiredProperties = _
    .chain(config.schema.properties)
    .toPairs()
    .map(([propertyName, schemaPropertyObject]) => {
      return `${propertyName}: ` +
        jsonSchemaTypeToGraphQlType[schemaPropertyObject.type];
    })

    .value();
  const joinedNonRequiredProperties = nonRequiredProperties.join('\n');

  const propertyFilters = _
    .chain(config.schema.properties)
    .toPairs()
    .filter(([_propertyName, schemaPropertyObject]) => (
      schemaPropertyObject.type === 'boolean'))
    .map(([propertyName, schemaPropertyObject]) => {
      return `${propertyName}: ` +
        jsonSchemaTypeToGraphQlFilterType[schemaPropertyObject.type];
    })
    .value();
  const joinedPropertyFilters = propertyFilters.join('\n');


  return [`
    type Object {
      id: ID!
      ${joinedProperties}
    }

    input CreateObjectInput {
      id: ID
      ${joinedProperties}
    }
    
    input UpdateObjectInput {
      id: ID!
      ${joinedProperties}
    }

    input FieldMatchingInput {
      id: ID
      ${joinedNonRequiredProperties}
    }

    input FilterInput {
      # filtering by id is not implemented currently
      # the id field is included to prevent having and empty type
      id: ID
      ${joinedPropertyFilters}
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
      objects: async (_root, { fields }) => {
        return objects.find(fields);
      },
      filteredObjects: async (_root, { filters } ) => {
        // removes all fields that has `false` as its value
        // this includes objects where the non-selected fields are true
        // i.e. it turns the yes/no logic into a yes/don't care logic
        const modifiedFilters = _.pickBy(filters, (value) => (value));

        return objects.find(modifiedFilters);
      },
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
      },

      updateObject: async (_root, { input }, context: Context) => {
        const newObject: ObjectDoc = createObjectFromInput(config, input);
        return await objects.updateOne(context, {id: input.id},
          {$set: newObject}, {upsert: true});
      },

      removeObject: async (_root, { id }, context: Context) => {
        return await objects.deleteOne(context, {id: id});
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
