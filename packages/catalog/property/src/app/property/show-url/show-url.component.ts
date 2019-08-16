import { Component, Input } from '@angular/core';


// from https://gist.github.com/dperini/729294
// which is used by ajv to validate "format": "url" fields
const URL_REGEX = new RegExp(
  '^' +
    // protocol identifier (optional)
    // short syntax // still required
    '(?:(?:(?:https?|ftp):)?\\/\\/)' +
    // capturing group to get base url
    '(' +
      // user:pass BasicAuth (optional)
      '(?:\\S+(?::\\S*)?@)?' +
      '(?:' +
        // IP address exclusion
        // private & local networks
        '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
        '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
        '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
        // IP address dotted notation octets
        // excludes loopback network 0.0.0.0
        // excludes reserved space >= 224.0.0.0
        // excludes network & broacast addresses
        // (first & last IP address of each class)
        '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
        '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
        '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
      '|' +
        // host & domain names, may end with dot
        // can be replaced by a shortest alternative
        // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
        '(?:' +
          '(?:' +
            '[a-z0-9\\u00a1-\\uffff]' +
            '[a-z0-9\\u00a1-\\uffff_-]{0,62}' +
          ')?' +
          '[a-z0-9\\u00a1-\\uffff]\\.' +
        ')+' +
        // TLD identifier name, may end with dot
        '(?:[a-z\\u00a1-\\uffff]{2,}\\.?)' +
      ')' +
      // port number (optional)
      '(?::\\d{2,5})?' +
    ')' +
    // resource path (optional)
    '(?:[/?#]\\S*)?' +
  '$', 'i'
);

/**
 * Display a URL property
 */
@Component({
  selector: 'property-show-url',
  templateUrl: './show-url.component.html',
  styleUrls: ['./show-url.component.css']
})
export class ShowUrlComponent {
  /**
   * The URL to display
   */
  @Input() url: string;
  /**
   * If false, show the whole URL. If true, show the URL without the
   * protocol and path
   */
  @Input() showBaseUrlOnly = false;

  getBaseUrl(url: string): string {
    const baseUrlGroupIndex = 1;
    const groups = url.match(URL_REGEX);
    return (groups && groups.length > baseUrlGroupIndex) ?
      groups[baseUrlGroupIndex] : '';
  }
}
