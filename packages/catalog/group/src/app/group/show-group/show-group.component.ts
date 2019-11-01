import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnDestroy, OnInit, Output, SimpleChanges, Type
} from '@angular/core';

import {
  ComponentValue, DvService, DvServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { Group } from '../shared/group.model';
import { ShowMemberComponent } from '../show-member/show-member.component';

import * as _ from 'lodash';


@Component({
  selector: 'group-show-group',
  templateUrl: './show-group.component.html',
  styleUrls: ['./show-group.component.css']
})
export class ShowGroupComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges, OnDestroy {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // One of `group` or `id` is required
  @Input() group: Group | undefined;
  @Input() id: string | undefined;

  @Input() showMembers = true;
  @Input() showGroupId = true;

  @Input() showMember: ComponentValue = {
    type: <Type<Component>> ShowMemberComponent
  };
  @Output() loadedGroup = new EventEmitter<Group>();

  showGroup;
  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory) {
    this.showGroup = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .withRefreshCallback(() => { this.load(); })
      .build();
  }

  ngAfterViewInit() {
    if (!this.group && !!this.id) {
      this.load();
    }
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
        .waitAndGet<{data: {group: Group}}> ('/graphql', () => ({
          params: {
            inputs: { id: this.id },
            extraInfo: {
              returnFields: `
              id
              memberIds
            `
            }
          }
        }));
        this.group = res.data.group;
        this.loadedGroup.emit(this.group);
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
