import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
  SimpleChanges, Type, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective
} from '@angular/forms';

import {
  ComponentValue, DvService, DvServiceFactory, OnExec, OnExecFailure,
  OnExecSuccess
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
export class CreateGroupComponent
  implements OnInit, OnExecSuccess, OnExecFailure, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
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

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder) {
    this.membersAutocomplete.valueChanges.subscribe((value) => {
      this.stagedMemberIds.emit(value);
    });
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dvs) {
      this.dvs.waiter.processChanges(changes);
    }
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    const res = await this.dvs.waitAndPost<{ data: any }>('/graphql', () => ({
      inputs: {
        input: {
          id: this.id,
          initialMemberIds: this.membersAutocomplete.value
        }
      },
      extraInfo: { returnFields: 'id' }
    }));
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
