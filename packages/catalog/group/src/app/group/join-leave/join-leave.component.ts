import { Component, ElementRef, Input, OnInit } from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { Group } from '../shared/group.model';


@Component({
  selector: 'group-join-leave',
  templateUrl: './join-leave.component.html',
  styleUrls: ['./join-leave.component.css']
})
export class JoinLeaveComponent implements OnExec, OnInit {
  @Input() memberId: string;
  // One of `group` or `groupId` is required
  @Input() group: Group;
  @Input() groupId: string;
  inGroup = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.load();
  }

  joinGroup() {
    this.rs.exec(this.elem);
  }

  leaveGroup() {
    this.rs.exec(this.elem);
  }

  load() {
    if (!this.gs || this.group) {
      this.inGroup = this.groupContains(this.group, this.memberId);

      return;
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

  private groupContains(group: Group, memberId: string) {
    return this.group ? _.includes(group!.memberIds, memberId) : false;
  }

  private getActionToTake() {
    return this.inGroup ? 'leave' : 'join';
  }
}
