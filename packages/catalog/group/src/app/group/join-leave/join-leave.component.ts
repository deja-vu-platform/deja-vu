import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

import { ShowGroupComponent } from '../show-group/show-group.component';

import { Group } from '../shared/group.model';


@Component({
  selector: 'group-join-leave',
  templateUrl: './join-leave.component.html',
  styleUrls: ['./join-leave.component.css']
})
export class JoinLeaveComponent implements OnInit {
  @Input() memberId: string;
  // One of `group` or `groupId` is required
  @Input() group: Group;
  @Input() groupId: string;
  inGroup = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.load();
  }

  joinGroup() {
    this.rs.run(this.elem);
  }

  leaveGroup() {
    this.rs.run(this.elem);
  }

  load() {
    if (!this.gs || this.group) {
      this.inGroup = this.groupContains(this.group, this.memberId);

      return;
    }
    this.gs.get<{data: any}>('/graphql', {
      params: {
        query: `
          query {
            group(id: "${this.groupId}") {
              id
              memberIds
            }
          }
        `
      }
    })
    .subscribe((res) => {
      this.group = res.data.group;
      this.inGroup = this.groupContains(this.group, this.memberId);
    });
  }

  async dvOnRun(): Promise<void> {
    if (!this.gs) {
      return;
    }
    const action = this.inGroup ? 'removeMember' : 'addMember';
    this.gs
      .post<{data: {groups: Group}}>('/graphql', {
        query: `
          mutation {
            ${action}(
              groupId: "${this.group.id}", id: "${this.memberId}") {
              id
            }
          }
        `
      })
      .subscribe((res) => {
        if (this.inGroup) {
          _.remove(this.group.memberIds, this.memberId);
          this.inGroup = false;
        } else {
          this.group.memberIds.push(this.memberId);
          this.inGroup = true;
        }
      });
  }

  private groupContains(group: Group, memberId: string) {
    return _.includes(group.memberIds, memberId);
  }
}
