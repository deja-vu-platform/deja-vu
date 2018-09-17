import * as _ from 'lodash';

export interface Property {
  name: string;
  required: boolean;
  schema: any;
}

export async function properties(
  showOnly: string[], showExclude: string[],
  propertyFetcher: () => Promise<string[]>): Promise<string[]> {
  let ret: string[] = [];
  if (!_.isEmpty(showOnly)) {
    ret = showOnly;
  } else if (!_.isEmpty(showExclude)) {
    const allProperties = await propertyFetcher();
    ret = _.difference(allProperties, showExclude);
  } else {
    ret = await propertyFetcher();
  }

  return ret;
}
