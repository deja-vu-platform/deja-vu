import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, Type
} from '@angular/core';

import {
  Action, GatewayService, GatewayServiceFactory, RunService
} from 'dv-core';
import * as _ from 'lodash';

import { properties, Property } from '../shared/property.model';

import { ShowObjectComponent } from '../show-object/show-object.component';

@Component({
  selector: 'property-choose-object',
  templateUrl: './choose-object.component.html',
  styleUrls: ['./choose-object.component.css']
})
export class ChooseObjectComponent implements OnInit, OnChanges {
  @Input() chooseObjectSelectPlaceholder = 'Choose Object';
  @Input() showObject: Action = {
    type: <Type<Component>> ShowObjectComponent
  };
  @Input() showOnly: string[];
  @Input() showExclude: string[];
  @Output() objects = new EventEmitter<Object[]>();
  _objects: Object[] = [];

  @Input() set initialObjectId(id: string) {
    this._selectedObjectId = id;
    this.selectedObjectId.emit(id);
  }
  @Output() selectedObjectId = new EventEmitter<string>();

  chooseObject;
  _selectedObjectId;
  private properties: string[];
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {
    this.chooseObject = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  async load() {
    if (!this.gs) {
      return;
    }
    this.properties = await properties(
      this.showOnly, this.showExclude, this.fetchProperties.bind(this));
    this.fetchObjects();
  }

  async fetchProperties(): Promise<string[]> {
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

  fetchObjects() {
    if (this.gs) {
      this.gs
        .get<{data: {objects: Object[]}}>('/graphql', {
          params: {
            query: `
              query {
                objects {
                  id
                  ${_.map(this.properties)
                      .join('\n')}
                }
              }
            `
          }
        })
        .subscribe((res) => {
          this._objects = res.data.objects;
          this.objects.emit(this._objects);
        });
    }
  }

  updateSelected(id: string) {
    this._selectedObjectId = id;
    this.selectedObjectId.emit(id);
    setTimeout(() => this.rs.run(this.elem));
  }
}
