import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { Resource } from '../shared/authorization.model';

import { API_PATH } from '../authorization.config';

import * as _ from 'lodash';

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
export class ShowResourcesComponent
  implements AfterViewInit, OnDestroy, OnEval, OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];

  @Input() createdBy: string | undefined;
  @Input() viewableBy: string | undefined;
  @Input() showResource: ComponentValue = {
    type: <Type<Component>> ShowResourceComponent
  };
  @Input() noResourcesText = 'No resources to show';
  @Output() resourceIds = new EventEmitter<string[]>();

  showResources = this;
  _resourceIds: string[];

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .withRefreshCallback(() => { this.load(); })
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.waitAndGet<ResourcesRes>(this.apiPath, () => ({
        params: {
          inputs: JSON.stringify({
            input: {
              createdBy: this.createdBy,
              viewableBy: this.viewableBy
            }
          }),
          extraInfo: { returnFields: 'id' }
        }
      }));
      this._resourceIds = _.map(res.data.resources, 'id');
      this.resourceIds.emit(this._resourceIds);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval(): boolean {
    return !!(this.dvs && (this.viewableBy || this.createdBy));
  }
}
