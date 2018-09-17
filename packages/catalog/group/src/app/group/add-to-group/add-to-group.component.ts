import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output,
  Type, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  Action, GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { ShowGroupComponent } from '../show-group/show-group.component';
import { ShowMemberComponent } from '../show-member/show-member.component';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'group-add-to-group',
  templateUrl: './add-to-group.component.html',
  styleUrls: ['./add-to-group.component.css']
})
export class AddToGroupComponent implements OnInit {
  @Input() id: string;

  @Input() set initialMemberId(id: string) {
    this.memberIdControl.setValue(id);
  }
  @Output() selectedId = new EventEmitter<string>();

  // Presentation inputs
  @Input() buttonLabel = `Add member`;
  @Input() addSavedText = `Member added to group`;

  @ViewChild(FormGroupDirective) form;

  memberIdControl = new FormControl('');
  addForm: FormGroup = this.builder.group({
    memberId: this.memberIdControl
  });


  addSaved = false;
  addError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{data: any}>('/graphql', {
      query: `mutation {
        addMember(
          groupId: "${this.id}",
          id: "${this.memberIdControl.value}") {
          id
        }
      }`
    })
    .toPromise();
  }

  dvOnAfterCommit() {
    this.addSaved = true;
    window.setTimeout(() => {
      this.addSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.addError = reason.message;
  }
}
