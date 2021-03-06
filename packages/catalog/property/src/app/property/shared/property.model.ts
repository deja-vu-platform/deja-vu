import * as _ from 'lodash';

import { ConfigService } from '@deja-vu/core';

export interface Property {
  name: string;
  required: boolean;
  schema: any;
}

// note: none of these functions include `id` because it's not part of `schema`

export function filterPropertyNames(only: string[], exclude: string[],
  propertyNames: string[]): string[] {
  if (!_.isEmpty(only)) {
    return only;
  } else if (!_.isEmpty(exclude)) {
    return _.difference(propertyNames, exclude);
  }

  return propertyNames;
}

export function getPropertyNames(cs: ConfigService): string[] {
  return _.keys(cs.getConfig()['schema'].properties);
}

export function getObjectTitleFromConfig(config: object) {
  return config['schema'].title;
}

export function getPropertyNamesFromConfig(config: object): string[] {
  return _.keys(config['schema'].properties);
}

export function getFilteredPropertyNames(only: string[], exclude: string[],
  cs: ConfigService): string[] {
   return filterPropertyNames(only, exclude, getPropertyNames(cs));
}

export function getPropertiesFromConfig(c): Property[] {
  const schema = c['schema'];

  return _
    .chain(schema.properties)
    .toPairs()
    .map(([ name, propertyInfo ]) => ({
      name: name,
      schema: propertyInfo,
      required: _.includes(schema.required, name)
    }))
    .value();
}

export function getProperties(cs: ConfigService): Property[] {
  return getPropertiesFromConfig(cs.getConfig());
}

export function getFilteredPropertyNamesFromConfig(only: string[],
     exclude: string[], config: object) {
  return filterPropertyNames (only, exclude,
    getPropertyNamesFromConfig(config));
}

/**
 * When a boolean field gets input "false",
 * it becomes "true" in the server.
 * It will only be false if the input is null.
 * This method changes all false boolean fields to null
 */
export function adjustFieldMatching(fieldMatching, schema) {
  if (fieldMatching && schema) {
    const adjustedFields = _.mapValues(fieldMatching,
      (value, key) => {
      if (key === 'id') {
        return _.isPlainObject(value) ? JSON.stringify(value) : value;
      }
      const schemaObjects = _.filter(schema, _.matches({name: key}));
      if (!schemaObjects || schemaObjects.length === 0) {
        throw new Error ('field ' + key + ' in fieldMatching ' +
          'does not match any field name of the schema');
      }
      const schemaObject = schemaObjects[0].schema;
      if (schemaObject.type === 'boolean' && !value) {
        return null;
      } else {
        return _.isPlainObject(value) ? JSON.stringify(value) : value;
      }
    });

    return adjustedFields;
  } else {
    return fieldMatching;
  }
}
