import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, Type
} from '@angular/core';

import {
  Action, GatewayService, GatewayServiceFactory, OnExecFailure,
  OnExecSuccess, RunService
} from '@deja-vu/core';

import { ShowMemberComponent } from '../show-member/show-member.component';

import * as _ from 'lodash';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'group-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.css']
})
export class CreateGroupComponent
  implements OnInit, OnExecSuccess, OnExecFailure {
  @Input() id: string | undefined;
  @Input() creatorId: string | undefined;

  @Input() choices: string[];

  @Input() memberIds: string[];
  @Input() set members(value: { id: string }[] | undefined) {
    if (value !== undefined) {
      this.memberIds = _.map(value, 'id');
    }
  }

  @Input() showOptionToAddMembers = true;
  @Input() showOptionToSubmit = true;
  @Input() showMember: Action = {
    type: <Type<Component>> ShowMemberComponent
  };

  // Presentation inputs
  @Input() buttonLabel = 'Create Group';
  @Input() newGroupSavedText = 'New Group saved';

  @Output() stagedMemberIds = new EventEmitter<string[]>();

  newGroupSaved = false;
  newGroupError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const initialMemberIds = this.creatorId ?
      [this.creatorId, ...this.memberIds] : this.memberIds;
    const res = await this.gs.post<{ data: any }>('/graphql', {
      inputs: {
        input: {
          id: this.id,
          initialMemberIds: initialMemberIds
        }
      },
      extraInfo: { returnFields: 'id' }
    })
      .toPromise();

    this.stagedMemberIds.emit(this.memberIds);
  }

  dvOnExecSuccess() {
    if (this.showOptionToSubmit) {
      this.newGroupSaved = true;
      this.newGroupError = '';
      window.setTimeout(() => {
        this.newGroupSaved = false;
      }, SAVED_MSG_TIMEOUT);
    }
  }

  dvOnExecFailure(reason: Error) {
    if (this.showOptionToSubmit) {
      this.newGroupError = reason.message;
    }
  }
}
