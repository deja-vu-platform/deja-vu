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

// from https://gist.github.com/dperini/729294
// which is used by ajv to validate "format": "url" fields
export const URL_REGEX = new RegExp(
  "^" +
    // protocol identifier (optional)
    // short syntax // still required
    "(?:(?:(?:https?|ftp):)?\\/\\/)" +
    // capturing group to get base url
    "(" +
      // user:pass BasicAuth (optional)
      "(?:\\S+(?::\\S*)?@)?" +
      "(?:" +
        // IP address exclusion
        // private & local networks
        "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
        "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
        "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
        // IP address dotted notation octets
        // excludes loopback network 0.0.0.0
        // excludes reserved space >= 224.0.0.0
        // excludes network & broacast addresses
        // (first & last IP address of each class)
        "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
        "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
        "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
      "|" +
        // host & domain names, may end with dot
        // can be replaced by a shortest alternative
        // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
        "(?:" +
          "(?:" +
            "[a-z0-9\\u00a1-\\uffff]" +
            "[a-z0-9\\u00a1-\\uffff_-]{0,62}" +
          ")?" +
          "[a-z0-9\\u00a1-\\uffff]\\." +
        ")+" +
        // TLD identifier name, may end with dot
        "(?:[a-z\\u00a1-\\uffff]{2,}\\.?)" +
      ")" +
      // port number (optional)
      "(?::\\d{2,5})?" +
    ")" +
    // resource path (optional)
    "(?:[/?#]\\S*)?" +
  "$", "i"
);
