import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective
} from '@angular/forms';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'group-add-to-group',
  templateUrl: './add-to-group.component.html',
  styleUrls: ['./add-to-group.component.css']
})
export class AddToGroupComponent
  implements OnExec, OnExecFailure, OnExecSuccess, OnInit {
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
  @Input() showDoneMessage = true;
  @Input() addSavedText = `Member added to group`;

  @ViewChild(FormGroupDirective) form;

  memberIdControl = new FormControl('');
  addForm: FormGroup = this.builder.group({
    memberId: this.memberIdControl
  });

  addSaved = false;
  addError: string;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    const res = await this.dvs.post<{ data: any }>('/graphql', {
      inputs: {
        groupId: this.id,
        id: this.memberIdControl.value
      }
    });
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
