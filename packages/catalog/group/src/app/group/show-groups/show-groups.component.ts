import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import { ShowGroupComponent } from '../show-group/show-group.component';

import { Group } from '../shared/group.model';


@Component({
  selector: 'group-show-groups',
  templateUrl: './show-groups.component.html',
  styleUrls: ['./show-groups.component.css']
})
export class ShowGroupsComponent implements OnInit, OnChanges {
  // Fetch rules
  // If undefined then the fetched groups are not filtered by that property
  @Input() withMemberId: string | undefined;
  @Input() withGroupId: string | undefined;
  @Input() inGroupId: string | undefined;

  @Input() directOnly = true;

  // Show rules
  @Input() showId = true;
  @Input() showMembers = true;
  @Input() showSubgroups = true;

  @Input() showGroup: Action = {
    type: <Type<Component>> ShowGroupComponent
  };
  groups: Group[] = [];

  showGroups;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.showGroups = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchGroups();
  }

  ngOnChanges() {
    this.fetchGroups();
  }

  fetchGroups() {
    if (this.gs) {
      this.gs
        .get<{data: {groups: Group[]}}>('/graphql', {
          params: {
            query: `
              query Groups($input: GroupsInput!) {
                groups(input: $input) {
                  ${this.showId ? 'id' : ''}
                  ${this.showMembers ? 'members { id }' : ''}
                  ${this.showSubgroups ? 'subgroups { id }' : ''}
                }
              }
            `,
            variables: JSON.stringify({
              input: {
                withMemberId: this.withMemberId,
                withGroupId: this.withGroupId,
                inGroupId: this.inGroupId
              }
            })
          }
        })
        .subscribe((res) => {
          this.groups = res.data.groups;
        });
    }
  }
}
