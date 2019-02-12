import {
  Component, EventEmitter, Input, Output, Type, ViewChild
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR
} from '@angular/forms';


import {
  ShowMemberComponent
} from '../show-member/show-member.component';

import * as _ from 'lodash';

@Component({
  selector: 'group-select-members',
  templateUrl: './select-members.component.html',
  styleUrls: ['./select-members.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SelectMembersComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: SelectMembersComponent,
      multi: true
    }
  ]
})
export class SelectMembersComponent {
  @Input() memberIds: string[] | undefined;
  @Input() set users(users: { id: string; username: string }[]) {
    this.memberIds = _.map(users, 'id');
  }

  @Input() showMember = {
    type: <Type<Component>> ShowMemberComponent
  };

  // Presentation inputs
  @Input() selectMembersPlaceholder = 'Select members';
  @Input() buttonLabel = 'Confirm selection';
  @Input() showOptionToSubmit = true;

  @Output() selected = new EventEmitter<string[]>();

  @ViewChild(FormGroupDirective) form;
  selectMembersFormControl = new FormControl('');
  selectMembersForm: FormGroup = this.builder.group({
    selectMembersFormControl: this.selectMembersFormControl
  });

  selectedMemberIds: string[] | undefined;
  selectMembers = this;


  constructor(private builder: FormBuilder) { }

  updateSelected(selectedMemberIds: string[]) {
    this.selectedMemberIds = selectedMemberIds;
    this.selected.emit(this.selectedMemberIds);
  }

  onSubmit() { }

  writeValue(value: string[]) {
    if (value) {
      this.selectedMemberIds = value;
    } else {
      this.selectedMemberIds = [];
    }

    this.selected.emit(this.selectedMemberIds);
  }

  registerOnChange(fn: (value: string[]) => void) {
    this.selected.subscribe(fn);
  }

  registerOnTouched() { }
}
