import * as _ from 'lodash';

export interface Property {
  name: string;
  required: boolean;
  schema: any;
}

export interface PropertiesRes {
  data: { properties: Property[] };
}

export interface PropertyRes {
  data: { property: Property };
}

export function properties(showOnly: string[], showExclude: string[],
  propertyNames: string[]): string[] {

  if (!_.isEmpty(showOnly)) {
    return showOnly;
  } else if (!_.isEmpty(showExclude)) {
    return _.difference(propertyNames, showExclude);
  }

  return propertyNames;
}
