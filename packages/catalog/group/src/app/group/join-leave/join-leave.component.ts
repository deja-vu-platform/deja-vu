import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit,
  SimpleChanges, Type
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnEval, OnExec, RunService
} from '@deja-vu/core';

import { Group } from '../shared/group.model';

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';


@Component({
  selector: 'group-join-leave',
  templateUrl: './join-leave.component.html',
  styleUrls: ['./join-leave.component.css']
})
export class JoinLeaveComponent implements AfterViewInit, OnEval, OnExec,
  OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();
  @Input() memberId: string;
  // One of `group` or `groupId` is required
  @Input() group: Group;
  @Input() groupId: string;
  @Input() joinGroupText = 'Join Group';
  @Input() leaveGroupText = 'Leave Group';

  inGroup = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

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
    if (this.canEval() && !this.group) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      if (this.group) {
        this.inGroup = this.groupContains(this.group, this.memberId);

        this.gs.noRequest();

        return;
      }
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
      this.gs.get<{ data: any }>('/graphql', {
        params: {
          inputs: { id: this.groupId },
          extraInfo: {
            action: 'is-in-group',
            returnFields: `
              id
              memberIds
            `
          }
        }
      })
        .subscribe((res) => {
          this.group = res.data.group;
          this.inGroup = this.groupContains(this.group, this.memberId);
        });

    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  joinGroup() {
    this.rs.exec(this.elem);
  }

  leaveGroup() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    if (!this.gs) {
      return;
    }
    this.gs.post<{ data: { groups: Group } }>('/graphql', {
      inputs: {
        groupId: this.group.id,
        id: this.memberId
      },
      extraInfo: { action: this.getActionToTake() }
    })
      .toPromise();
  }

  dvOnExecSuccess() {
    if (this.inGroup) {
      _.remove(this.group.memberIds, this.memberId);
      this.inGroup = false;
    } else {
      this.group.memberIds.push(this.memberId);
      this.inGroup = true;
    }
  }

  dvOnExecFailure(reason: Error) {
    console.log(reason.message);
  }

  private canEval(): boolean {
    return !!(this.gs);
  }

  private groupContains(group: Group, memberId: string) {
    return this.group ? _.includes(group!.memberIds, memberId) : false;
  }

  private getActionToTake() {
    return this.inGroup ? 'leave' : 'join';
  }
}
