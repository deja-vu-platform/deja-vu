import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges,
  OnDestroy, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { ShowMemberComponent } from '../show-member/show-member.component';

import * as _ from 'lodash';


@Component({
  selector: 'group-show-members',
  templateUrl: './show-members.component.html',
  styleUrls: ['./show-members.component.css']
})
export class ShowMembersComponent
  implements AfterViewInit, OnDestroy, OnEval, OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Fetch rules
  @Input() inGroupId: string | undefined;

  // Presentation rules
  @Input() noMembersText = 'No members';

  @Input() showMember: ComponentValue = {
    type: <Type<Component>> ShowMemberComponent
  };

  @Output() loadedMemberIds = new EventEmitter<string[]>();

  memberIds: string[] = [];

  showMembers;
  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory) {
    this.showMembers = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent (this)
      .withDefaultWaiter()
      .withRefreshCallback(() => { this.load(); })
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
        .waitAndGet<{ data: { members: string[] } }>('/graphql', () => ({
          params: {
            inputs: JSON.stringify({
              input: {
                inGroupId: this.inGroupId
              }
            })
          }
        }));
        this.memberIds = res.data.members;
        this.loadedMemberIds.emit(this.memberIds);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
