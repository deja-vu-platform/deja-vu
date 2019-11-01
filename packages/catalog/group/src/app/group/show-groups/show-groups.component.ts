import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit,
  Output, SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
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
export class ShowGroupsComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
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
  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory) {
    this.showGroups = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
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
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs
        .waitAndGet<{ data: { groups: Group[] } }>('/graphql', () => ({
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
        }));
        this._groups = res.data.groups;
        this.groups.emit(this._groups);
        this.groupIds.emit(_.map(this._groups, 'id'));
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
