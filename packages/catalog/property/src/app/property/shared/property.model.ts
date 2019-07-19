import * as _ from 'lodash';

import { ConfigService } from '@deja-vu/core';

export interface Property {
  name: string;
  required: boolean;
  schema: any;
}

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
