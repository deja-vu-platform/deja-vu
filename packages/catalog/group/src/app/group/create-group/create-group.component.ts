import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, Type,
  ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  Action, GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';


import { ShowGroupComponent } from '../show-group/show-group.component';
import { ShowMemberComponent } from '../show-member/show-member.component';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'group-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.css']
})
export class CreateGroupComponent
implements OnInit, OnAfterCommit, OnAfterAbort {
  @Input() id;
  @Input() assignerId;
  @Input() initialMemberIds: string[] = [];
  @Input() initialGroupIds: string[] = [];
  @Input() showOptionToAddMembers = true;
  @Input() showOptionToAddGroups = true;
  @Input() showOptionToSubmit = true;
  @Input() showMember: Action = {
    type: <Type<Component>> ShowMemberComponent
  };

  @Input() showGroup: Action = {
    type: <Type<Component>> ShowGroupComponent
  };
  @Input() stageHeader: Action | undefined;

  // Presentation inputs
  @Input() memberAutocompletePlaceholder = 'Choose Member';
  @Input() stageMemberButtonLabel = 'Add Member';
  @Input() groupAutocompletePlaceholder = 'Choose Group';
  @Input() stageGroupButtonLabel = 'Add Group';
  @Input() buttonLabel = 'Create Group';
  @Input() newGroupSavedText = 'New Group saved';

  @Output() stagedMemberIds = new EventEmitter<string[]>();

  @ViewChild(FormGroupDirective) form;

  membersAutocomplete;
  groupAutocomplete;
  createGroupForm: FormGroup;

  newGroupSaved = false;
  newGroupError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.membersAutocomplete = new FormControl(this.initialMemberIds);
    this.groupAutocomplete = new FormControl(this.initialGroupIds);
    this.membersAutocomplete.valueChanges.subscribe((value) => {
      this.stagedMemberIds.emit(value);
    });
    this.createGroupForm =  this.builder.group({
      membersAutocomplete: this.membersAutocomplete,
      groupAutocomplete: this.groupAutocomplete
    });
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{data: any}>('/graphql', {
      query: `mutation CreateGroup($input: CreateGroupInput!) {
        createGroup(input: $input) {
          id
        }
      }`,
      variables: {
        input: {
          id: this.id,
          initialMemberIds: this.membersAutocomplete.value,
          initialSubgroupIds: this.groupAutocomplete.value
        }
      }
    })
    .toPromise();
  }

  dvOnAfterCommit() {
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

  dvOnAfterAbort(reason: Error) {
    if (this.showOptionToSubmit) {
      this.newGroupError = reason.message;
    }
  }
}
