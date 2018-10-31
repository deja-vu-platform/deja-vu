import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnInit, Output, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { Resource } from '../shared/authorization.model';

import { API_PATH } from '../authorization.config';

import {
  ShowResourceComponent
} from '../show-resource/show-resource.component';

interface ResourcesRes {
  data: { resources: Resource; };
}


@Component({
  selector: 'authorization-show-resources',
  templateUrl: './show-resources.component.html',
  styleUrls: ['./show-resources.component.css']
})
export class ShowResourcesComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
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
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
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
      .subscribe((res) => {
        console.log('resources viewable by' + this.viewableBy);
        console.log(res);
        this._resourceIds = _.map(res.data.resources, 'id');
        this.resourceIds.emit(this._resourceIds);
      });
    }
  }

  private canEval(): boolean {
    return !!(this.gs && this.viewableBy);
  }
}
