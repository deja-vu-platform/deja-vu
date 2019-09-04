import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  Type
} from '@angular/core';
import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { ShowMemberComponent } from '../show-member/show-member.component';

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';


@Component({
  selector: 'group-show-members',
  templateUrl: './show-members.component.html',
  styleUrls: ['./show-members.component.css']
})
export class ShowMembersComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();
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
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {
    this.showMembers = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const field of this.waitOn) {
      if (changes[field] && !_.isNil(changes[field].currentValue)) {
        this.fieldChange.emit(field);
      }
    }
    // We should only reload iif what changed is something we are not
    // waiting on (because if ow we would send a double request)
    let shouldLoad = false;
    for (const fieldThatChanged of _.keys(changes)) {
      if (!this.activeWaits.has(fieldThatChanged)) {
        shouldLoad = true;
      }
    }
    if (shouldLoad) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      if (!_.isEmpty(this.waitOn)) {
        await Promise.all(_.chain(this.waitOn)
          .filter((field) => _.isNil(this[field]))
          .tap((fs) => {
            this.activeWaits = new Set(fs);

            return fs;
          })
          .map((fieldToWaitFor) => this.fieldChange
            .pipe(filter((field) => field === fieldToWaitFor), take(1))
            .toPromise())
          .value());
      }
      this.gs
        .get<{ data: { members: string[] } }>('/graphql', {
          params: {
            inputs: JSON.stringify({
              input: {
                inGroupId: this.inGroupId
              }
            })
          }
        })
        .subscribe((res) => {
          this.memberIds = res.data.members;
          this.loadedMemberIds.emit(this.memberIds);
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
