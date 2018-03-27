import {
  Component, ElementRef, EventEmitter, Input, OnInit, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'group-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.css']
})
export class CreateGroupComponent implements OnInit {
  @Input() id;
  @Input() assignerId;
  @Input() initialMemberIds: string[] = [];
  @Input() initialGroupIds: string[] = [];
  @Input() showOptionToAddMembers = true;
  @Input() showOptionToAddGroups = true;

  // Presentation inputs
  @Input() memberAutocompletePlaceholder = 'Choose Member';
  @Input() groupAutocompletePlaceholder = 'Choose Group';
  @Input() buttonLabel = 'Create Group';
  @Input() newGroupSavedText = 'New Group saved';

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
    this.newGroupSaved = true;
    window.setTimeout(() => {
      this.newGroupSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.newGroupError = reason.message;
  }
}
