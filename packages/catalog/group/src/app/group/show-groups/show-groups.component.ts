import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit,
  Output, SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { ShowGroupComponent } from '../show-group/show-group.component';

import { Group } from '../shared/group.model';

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';


@Component({
  selector: 'group-show-groups',
  templateUrl: './show-groups.component.html',
  styleUrls: ['./show-groups.component.css']
})
export class ShowGroupsComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();
  // Fetch rules
  // If undefined then the fetched groups are not filtered by that property
  @Input() withMemberId = '';

  // Show rules
  @Input() showId = true;
  @Input() showMembers = true;
  @Input() loadMembers = true;

  @Input() showGroup: ComponentValue = {
    type: <Type<Component>> ShowGroupComponent
  };
  @Input() noGroupsToShowText = 'No groups to show';
  _groups: Group[] = [];
  @Output() groups = new EventEmitter<Group[]>();
  @Output() groupIds = new EventEmitter<string[]>();

  showGroups;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {
    this.showGroups = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
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
      this.gs
        .get<{data: {groups: Group[]}}>('/graphql', {
          params: {
            inputs: JSON.stringify({
              input: {
                withMemberId: this.withMemberId
              }
            }),
            extraInfo: {
              returnFields: `
                id
                ${this.loadMembers ? 'memberIds' : ''}
              `
            }
          }
        })
        .subscribe((res) => {
          this._groups = res.data.groups;
          this.groups.emit(this._groups);
          this.groupIds.emit(_.map(this._groups, 'id'));
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
