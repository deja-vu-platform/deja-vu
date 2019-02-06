import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, Type,
  ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective
} from '@angular/forms';

import {
  Action, GatewayService, GatewayServiceFactory, OnExec, OnExecFailure,
  OnExecSuccess, RunService
} from '@dejavu-lang/core';

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
  @Input() id;

  @Input()
  set memberIds(value: string[] | undefined) {
    if (value !== undefined) {
      this.membersAutocomplete.setValue(value);
    }
  }

  @Input()
  set members(value: { id: string }[] | undefined) {
    if (value !== undefined) {
      this.membersAutocomplete.setValue(_.map(value, 'id'));
    }
  }

  @Input() showOptionToAddMembers = true;
  @Input() showOptionToSubmit = true;
  @Input() showMember: Action = {
    type: <Type<Component>> ShowMemberComponent
  };

  @Input() stageHeader: Action | undefined;

  // Presentation inputs
  @Input() memberAutocompletePlaceholder = 'Choose Member';
  @Input() stageMemberButtonLabel = 'Add Member';
  @Input() buttonLabel = 'Create Group';
  @Input() newGroupSavedText = 'New Group saved';

  @Output() stagedMemberIds = new EventEmitter<string[]>();

  @ViewChild(FormGroupDirective) form;

  membersAutocomplete = new FormControl();
  createGroupForm: FormGroup = this.builder.group({
    membersAutocomplete: this.membersAutocomplete
  });

  newGroupSaved = false;
  newGroupError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {
    this.membersAutocomplete.valueChanges.subscribe((value) => {
      this.stagedMemberIds.emit(value);
    });
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<{data: any}>('/graphql', {
      inputs: {
        input: {
          id: this.id,
          initialMemberIds: this.membersAutocomplete.value
        }
      },
      extraInfo: { returnFields: 'id' }
    })
    .toPromise();
  }

  dvOnExecSuccess() {
    if (this.showOptionToSubmit) {
      this.newGroupSaved = true;
      this.newGroupError = '';
      window.setTimeout(() => {
        this.newGroupSaved = false;
      }, SAVED_MSG_TIMEOUT);
    }
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    if (this.showOptionToSubmit) {
      this.newGroupError = reason.message;
    }
  }
}
