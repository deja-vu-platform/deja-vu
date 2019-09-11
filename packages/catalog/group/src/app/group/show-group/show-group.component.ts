import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnDestroy, OnInit, Output, SimpleChanges, Type
} from '@angular/core';

import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { Subject } from 'rxjs/Subject';

import { Group } from '../shared/group.model';
import { ShowMemberComponent } from '../show-member/show-member.component';

import * as _ from 'lodash';
import { filter, take, takeUntil } from 'rxjs/operators';


@Component({
  selector: 'group-show-group',
  templateUrl: './show-group.component.html',
  styleUrls: ['./show-group.component.css']
})
export class ShowGroupComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();
  // One of `group` or `id` is required
  @Input() group: Group | undefined;
  @Input() id: string | undefined;

  @Input() showMembers = true;
  @Input() showGroupId = true;

  @Input() showMember: ComponentValue = {
    type: <Type<Component>> ShowMemberComponent
  };
  @Output() loadedGroup = new EventEmitter<Group>();

  destroyed = new Subject<any>();
  showGroup;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private router: Router, private rs: RunService) {
    this.showGroup = this;
  }

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
    if (!this.group && !!this.id) {
      this.load();
    }
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
      this.gs
        .get<{data: {group: Group}}> ('/graphql', {
          params: {
            inputs: { id: this.id },
            extraInfo: {
              returnFields: `
              id
              memberIds
            `
            }
          }
        })
        .subscribe((res) => {
          this.group = res.data.group;
          this.loadedGroup.emit(this.group);
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
    return !!(this.gs);
  }
}
