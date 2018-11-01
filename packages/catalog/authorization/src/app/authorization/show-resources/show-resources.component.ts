import {
  Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnInit, Output, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { Resource } from '../shared/authorization.model';

import { API_PATH } from '../authorization.config';

import {
  ShowResourceComponent
} from '../show-resource/show-resource.component';

interface ResourcesRes {
  data: { resources: Resource[]; };
}


@Component({
  selector: 'authorization-show-resources',
  templateUrl: './show-resources.component.html',
  styleUrls: ['./show-resources.component.css']
})
export class ShowResourcesComponent implements OnInit, OnChanges {
  @Input() viewableBy: string;
  @Input() showResource: Action = {
    type: <Type<Component>> ShowResourceComponent
  };
  @Input() noResourcesText = 'No resources to show';
  @Output() resourceIds = new EventEmitter<string[]>();

  showResources = this;
  _resourceIds: string[];

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (!this.gs || !this.viewableBy) {
      return;
    }
    this.gs.get<ResourcesRes>(this.apiPath, {
      params: {
        query: `
          query Resources($input: ResourcesInput!) {
            resources(input: $input) {
              id
            }
          }
        `,
        variables: JSON.stringify({
          input: {
            viewableBy: this.viewableBy
          }
        })
      }
    })
    .subscribe((res: ResourcesRes) => {
      this._resourceIds = _.map(res.data.resources, 'id');
      this.resourceIds.emit(this._resourceIds);
    });
  }
}
