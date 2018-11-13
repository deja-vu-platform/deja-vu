import { Component, Input } from '@angular/core';

import { URL_REGEX } from '../shared/property.model';


@Component({
  selector: 'property-show-property-url',
  templateUrl: './show-property-url.component.html',
  styleUrls: ['./show-property-url.component.css']
})
export class ShowPropertyUrlComponent {
  @Input() url: string;
  @Input() showBaseUrlOnly: boolean = false;

  getBaseUrl(url: string): string {
    const baseUrlGroupIndex = 1;
    const groups = url.match(URL_REGEX);
    return (groups && groups.length > baseUrlGroupIndex) ?
      groups[baseUrlGroupIndex] : '';
  }
}
