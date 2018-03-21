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

  async ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    await this.fetchProperties();
    this.fetchObject();
  }

  async ngOnChanges() {
    await this.fetchProperties();
    this.fetchObject();
  }

  async fetchProperties() {
    if (this.gs && !this.showOnly && !this.properties) {
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
      this.properties = _.map(res.data.properties, 'name');
    }
  }

  fetchObject() {
    let propertiesToFetch = [];
    if (this.showOnly) {
      propertiesToFetch = this.showOnly;
    } else if (this.showExclude) {
      propertiesToFetch = _
        .difference(this.properties, this.showExclude);
    } else {
      propertiesToFetch = this.properties;
    }
    if (this.gs && this.id && this.properties) {
      this.gs
        .get<{data: {object: Object}}>('/graphql', {
          params: {
            query: `
              query {
                object(id: "${this.id}") {
                  ${propertiesToFetch.join('\n')}
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
