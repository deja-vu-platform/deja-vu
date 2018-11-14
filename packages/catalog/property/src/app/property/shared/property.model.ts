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

export async function properties(
  showOnly: string[], showExclude: string[],
  propertyFetcher: () => Promise<string[]>): Promise<string[]> {
  let ret: string[] = await propertyFetcher();

  if (!_.isEmpty(showOnly)) {
    ret = showOnly;
  } else if (!_.isEmpty(showExclude)) {
    ret = _.difference(ret, showExclude);
  }

  return ret;
}
