import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
  SimpleChanges, Type, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective
} from '@angular/forms';

import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnExec, OnExecFailure,
  OnExecSuccess, RunService
} from '@deja-vu/core';

import { ShowMemberComponent } from '../show-member/show-member.component';

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'group-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.css']
})
export class CreateGroupComponent implements OnInit, OnExecSuccess,
  OnExecFailure, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  @Input() id: string | undefined;

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
  @Input() showMember: ComponentValue = {
    type: <Type<Component>> ShowMemberComponent
  };

  @Input() stageHeader: ComponentValue | undefined;
  @Input() resetOnExecSuccess = true;

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

  ngOnChanges(changes: SimpleChanges) {
    for (const field of this.waitOn) {
      if (changes[field] && !_.isNil(changes[field].currentValue)) {
        this.fieldChange.emit(field);
      }
    }
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    if (!_.isEmpty(this.waitOn)) {
      await Promise.all(_.chain(this.waitOn)
        .filter((field) => {
          if (field === 'members' || field === 'memberIds') {
            return _.isNil(this.membersAutocomplete.value);
          } else {
            return _.isNil(this[field]);
          }
        })
        .map((fieldToWaitFor) => this.fieldChange
          .pipe(filter((field) => field === fieldToWaitFor), take(1))
          .toPromise())
        .value());
    }
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
    if (this.resetOnExecSuccess && this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    if (this.showOptionToSubmit) {
      this.newGroupError = reason.message;
    }
  }
}
