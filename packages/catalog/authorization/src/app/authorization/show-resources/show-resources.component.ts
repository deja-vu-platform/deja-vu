import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { Resource } from '../shared/authorization.model';

import { API_PATH } from '../authorization.config';

import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { Subject } from 'rxjs/Subject';

import * as _ from 'lodash';
import { filter, take, takeUntil } from 'rxjs/operators';


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
export class ShowResourcesComponent implements
  AfterViewInit, OnDestroy, OnEval, OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();

  @Input() createdBy: string | undefined;
  @Input() viewableBy: string | undefined;
  @Input() showResource: ComponentValue = {
    type: <Type<Component>> ShowResourceComponent
  };
  @Input() noResourcesText = 'No resources to show';
  @Output() resourceIds = new EventEmitter<string[]>();

  showResources = this;
  _resourceIds: string[];

  destroyed = new Subject<any>();
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private router: Router, private rs: RunService,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.router.events
      .pipe(
        filter((e: RouterEvent) => e instanceof NavigationEnd),
        takeUntil(this.destroyed))
      .subscribe(() => {
        this.load();
      });
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const field of this.waitOn) {
      if (changes[field] && !_.isNil(changes[field].currentValue)) {
        this.fieldChange.emit(field);
      }
    }
    // We should only reload iif what changed is something we are not
    // waiting on (because if ow we would send a double request)
    let shouldLoad = false;
    for (const fieldThatChanged of _.keys(changes)) {
      if (!this.activeWaits.has(fieldThatChanged)) {
        shouldLoad = true;
      }
    }
    if (shouldLoad) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      if (!_.isEmpty(this.waitOn)) {
        await Promise.all(_.chain(this.waitOn)
          .filter((field) => _.isNil(this[field]))
          .tap((fs) => {
            this.activeWaits = new Set(fs);

            return fs;
          })
          .map((fieldToWaitFor) => this.fieldChange
            .pipe(filter((field) => field === fieldToWaitFor), take(1))
            .toPromise())
          .value());
      }
      this.gs.get<ResourcesRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              createdBy: this.createdBy,
              viewableBy: this.viewableBy
            }
          }),
          extraInfo: { returnFields: 'id' }
        }
      })
      .subscribe((res: ResourcesRes) => {
        this._resourceIds = _.map(res.data.resources, 'id');
        this.resourceIds.emit(this._resourceIds);
      });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private canEval(): boolean {
    return !!(this.gs && (this.viewableBy || this.createdBy));
  }
}
