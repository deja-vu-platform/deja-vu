import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit,
  SimpleChanges, Type
} from '@angular/core';

import {
  DvService, DvServiceFactory, OnEval, OnExec
} from '@deja-vu/core';

import { Group } from '../shared/group.model';

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';


@Component({
  selector: 'group-join-leave',
  templateUrl: './join-leave.component.html',
  styleUrls: ['./join-leave.component.css']
})
export class JoinLeaveComponent
  implements AfterViewInit, OnEval, OnExec, OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  @Input() memberId: string;
  // One of `group` or `groupId` is required
  @Input() group: Group;
  @Input() groupId: string;
  @Input() joinGroupText = 'Join Group';
  @Input() leaveGroupText = 'Leave Group';

  inGroup = false;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef,
    private readonly dvf: DvServiceFactory) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
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
    if (this.canEval() && !this.group) {
      this.dvs.eval();
    } else if (this.group) {
      this.inGroup = this.groupContains(this.group, this.memberId);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      if (this.group) {
        this.inGroup = this.groupContains(this.group, this.memberId);
        this.dvs.noRequest();

        return;
      }
      const res = await this.dvs.waitAndGet<{ data: any }>('/graphql', () => ({
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
      }));
      this.group = res.data.group;
      this.inGroup = this.groupContains(this.group, this.memberId);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  joinGroup() {
    this.dvs.exec();
  }

  leaveGroup() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    if (!this.dvs) {
      return;
    }
    await this.dvs.post<{ data: { groups: Group } }>('/graphql', {
      inputs: {
        groupId: this.group.id,
        id: this.memberId
      },
      extraInfo: { action: this.getActionToTake() }
    });
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
    return !!(this.dvs);
  }

  private groupContains(group: Group, memberId: string) {
    return this.group ? _.includes(group!.memberIds, memberId) : false;
  }

  private getActionToTake() {
    return this.inGroup ? 'leave' : 'join';
  }
}
