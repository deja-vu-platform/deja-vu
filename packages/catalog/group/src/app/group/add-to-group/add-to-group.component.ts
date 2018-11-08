import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure,
  OnExecSuccess, RunService
} from 'dv-core';

import * as _ from 'lodash';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'group-add-to-group',
  templateUrl: './add-to-group.component.html',
  styleUrls: ['./add-to-group.component.css']
})
export class AddToGroupComponent implements OnExec, OnExecFailure, OnExecSuccess,
  OnInit {
  @Input() id: string;

  @Input() set memberId(value: string | undefined) {
    if (value !== undefined) {
      this.memberIdControl.setValue(value);
    }
  }

  @Input() set member(value: { id: string } | undefined) {
    if (value !== undefined) {
      this.memberIdControl.setValue(value.id);
    }
  }

  @Input() showInput = true;

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
    private rs: RunService, private builder: FormBuilder) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<{ data: any }>('/graphql', {
      query: `mutation {
        addMember(
          groupId: "${this.id}",
          id: "${this.memberIdControl.value}")
      }`
    })
      .toPromise();
  }

  dvOnExecSuccess() {
    this.selectedId.emit(this.memberIdControl.value);
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

  dvOnExecFailure(reason: Error) {
    this.addError = reason.message;
  }
}
