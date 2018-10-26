import * as Ajv from 'ajv';
import {
  ClicheServer,
  ClicheServerBuilder,
  Config,
  Context
} from 'cliche-server';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import { ObjectDoc } from './schema';
import { v4 as uuid } from 'uuid';

const jsonSchemaTypeToGraphQlType = {
  integer: 'Int',
  number: 'Float',
  string: 'String',
  boolean: 'Boolean'
  /* Not supported yet: object, array, null */
};

interface Property {
  title: { type: keyof typeof jsonSchemaTypeToGraphQlType }
}

interface Schema {
  properties: Property[];
  required?: string[];
  title: string;
  type: 'object'
}

interface PropertyConfig extends Config {
  initialObjects: Object[];
  schema: Schema;
}

function getDynamicTypeDefs(uncastConfig: Config): string[] {
  const config: PropertyConfig = uncastConfig as PropertyConfig;
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

function createObjectFromInput(uncastConfig: Config, input) {
  const config: PropertyConfig = uncastConfig as PropertyConfig;
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

function resolvers(db: mongodb.Db, uncastConfig: Config): object {
  const config: PropertyConfig = uncastConfig as PropertyConfig;
  const objects: mongodb.Collection<ObjectDoc> = db.collection('objects');
  const resolversObj = {
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
      createObject: async (root, { input }, context: Context) => {
        const newObject: ObjectDoc = createObjectFromInput(config, input);
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

        return;
      },

      createObjects: async (root, { input }, context: Context) => {
        const objDocs: ObjectDoc[] = _.map(
          input, (i) => createObjectFromInput(config, i));
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

        return;
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
};

const propertyCliche: ClicheServer = new ClicheServerBuilder('property')
  .initDb(async (db: mongodb.Db, uncastConfig: Config): Promise<any> => {
    const config: PropertyConfig = uncastConfig as PropertyConfig;
    const objects: mongodb.Collection<ObjectDoc> = db.collection('objects');
    await objects.createIndex({ id: 1 }, { unique: true, sparse: true });
    if (!_.isEmpty(config.initialObjects)) {
      return objects.insertMany(_.map(config.initialObjects, (obj) => {
        obj.id = obj.id ? obj.id : uuid();

        return obj;
      }));
    }
    return Promise.resolve();
  })
  .resolvers(resolvers)
  .dynamicTypeDefs(getDynamicTypeDefs)
  .build();

propertyCliche.start();
