import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import { ShowMemberComponent } from '../show-member/show-member.component';


@Component({
  selector: 'group-show-members',
  templateUrl: './show-members.component.html',
  styleUrls: ['./show-members.component.css']
})
export class ShowMembersComponent implements OnInit, OnChanges {
  // Fetch rules
  @Input() inGroupId: string | undefined;

  @Input() showMember: Action = {
    type: <Type<Component>> ShowMemberComponent
  };
  memberIds: string[] = [];

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
        .get<{data: {members: string[]}}>('/graphql', {
          params: {
            query: `
              query Members($input: MembersInput!) {
                members(input: $input)
              }
            `,
            variables: JSON.stringify({
              input: {
                inGroupId: this.inGroupId
              }
            })
          }
        })
        .subscribe((res) => {
          this.memberIds = res.data.members;
        });
    }
  }
}
