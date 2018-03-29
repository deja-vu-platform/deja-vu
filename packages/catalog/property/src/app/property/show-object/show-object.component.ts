import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import { Property } from '../shared/property.model';

@Component({
  selector: 'property-show-object',
  templateUrl: './show-object.component.html',
  styleUrls: ['./show-object.component.css']
})
export class ShowObjectComponent implements OnInit, OnChanges {
  @Input() id: string;
  @Input() showOnly: string[];
  @Input() showExclude: string[];

  properties: string[];
  object: Object;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  async load() {
    if (!this.gs) {
      return;
    }

    const allProperties = await this.fetchProperties();
    let propertiesToFetch = [];
    if (this.showOnly) {
      propertiesToFetch = this.showOnly;
    } else if (this.showExclude) {
      propertiesToFetch = _
        .difference(allProperties, this.showExclude);
    } else {
      propertiesToFetch = allProperties;
    }
    this.properties = propertiesToFetch;

    this.fetchObject();
  }

  async fetchProperties(): Promise<string[]> {
    if (!this.showOnly) {
      const res = await this.gs
        .get<{data: {properties: Property[]}}>('/graphql', {
          params: {
            query: `
              query {
                properties {
                  name
                }
              }
            `
          }
        })
        .toPromise();

      return _.map(res.data.properties, 'name');
    }
  }

  fetchObject() {
    if (this.id && this.properties) {
      this.gs
        .get<{data: {object: Object}}>('/graphql', {
          params: {
            query: `
              query {
                object(id: "${this.id}") {
                  ${this.properties.join('\n')}
                }
              }
            `
          }
        })
        .subscribe((res) => {
          this.object = res.data.object;
        });
    }
  }
}
