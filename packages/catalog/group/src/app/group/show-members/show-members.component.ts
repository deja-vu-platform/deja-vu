import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import { ShowMemberComponent } from '../show-member/show-member.component';

import { Member } from '../shared/group.model';


@Component({
  selector: 'group-show-members',
  templateUrl: './show-members.component.html',
  styleUrls: ['./show-members.component.css']
})
export class ShowMembersComponent implements OnInit, OnChanges {
  // Fetch rules
  @Input() inGroupId: string | undefined;
  @Input() directOnly = true;

  @Input() showMember: Action = {
    type: <Type<Component>> ShowMemberComponent
  };
  members: Member[] = [];

  showMembers;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.showMembers = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchMembers();
  }

  ngOnChanges() {
    this.fetchMembers();
  }

  fetchMembers() {
    if (this.gs) {
      this.gs
        .get<{data: {members: Member[]}}>('/graphql', {
          params: {
            query: `
              query Members($input: MembersInput!) {
                members(input: $input) {
                  id
                }
              }
            `,
            variables: JSON.stringify({
              input: {
                inGroupId: this.inGroupId,
                directOnly: this.directOnly
              }
            })
          }
        })
        .subscribe((res) => {
          this.members = res.data.members;
        });
    }
  }
}
