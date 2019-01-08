import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit,
  Output, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';
import * as _ from 'lodash';

import { ShowGroupComponent } from '../show-group/show-group.component';

import { Group } from '../shared/group.model';


@Component({
  selector: 'group-show-groups',
  templateUrl: './show-groups.component.html',
  styleUrls: ['./show-groups.component.css']
})
export class ShowGroupsComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
  // Fetch rules
  // If undefined then the fetched groups are not filtered by that property
  @Input() withMemberId = '';

  // Show rules
  @Input() showId = true;
  @Input() showMembers = true;
  @Input() loadMembers = true;

  @Input() showGroup: Action = {
    type: <Type<Component>> ShowGroupComponent
  };
  _groups: Group[] = [];
  @Output() groups = new EventEmitter<Group[]>();

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

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs
        .get<{data: {groups: Group[]}}>('/graphql', {
          params: {
            query: `
              query Groups($input: GroupsInput!) {
                groups(input: $input) {
                  id
                  ${this.loadMembers ? 'memberIds' : ''}
                }
              }
            `,
            variables: JSON.stringify({
              input: {
                withMemberId: this.withMemberId
              }
            })
          }
        })
        .subscribe((res) => {
          this._groups = res.data.groups;
          this.groups.emit(this._groups);
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
