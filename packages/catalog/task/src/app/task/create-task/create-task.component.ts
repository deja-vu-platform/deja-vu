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

import { Task } from '../shared/task.model';

interface CreateTaskResponse {
  data: { createTask: Task[] };
  errors: { message: string }[];
}


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'task-create-task',
  templateUrl: './create-task.component.html',
  styleUrls: ['./create-task.component.css']
})
export class CreateTaskComponent
  implements OnInit, OnExec, OnExecFailure, OnExecSuccess {
  @Input() id;
  @Input() assignerId;
  @Input() showOptionToInputAssignee = true;
  @Input() showOptionToInputDueDate = true;
  @Input() showOptionToSubmit = true;

  @Input() set assigneeId(assigneeId: string) {
    this.assigneeControl.setValue(assigneeId);
  }
  @Input() set dueDate(dueDate: string) {
    this.dueDateControl.setValue(dueDate);
  }

  // Presentation inputs
  @Input() assigneeInputPlaceholder = 'Assignee';
  @Input() buttonLabel = 'Create Task';
  @Input() newTaskSavedText = 'New task saved';

  @ViewChild(FormGroupDirective) form;

  @Output() selectedAssignee = new EventEmitter<string>();

  assigneeControl = new FormControl('');
  dueDateControl = new FormControl('');
  createTaskForm: FormGroup = this.builder.group({
    assignee: this.assigneeControl,
    dueDate: this.dueDateControl
  });


  newTaskSaved = false;
  newTaskError: string;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  onSubmit() {
    this.dvs.exec();
  }

  outputSelectedAssignee(selectedAssignee: string) {
    this.selectedAssignee.emit(selectedAssignee);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.dvs.post<CreateTaskResponse>('/graphql', {
      inputs: {
        input: {
          id: this.id,
          assignerId: this.assignerId,
          assigneeId: this.assigneeControl.value,
          dueDate: this.dueDateControl.value
        }
      },
      extraInfo: { returnFields: 'id' }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnExecSuccess() {
    this.newTaskSaved = true;
    window.setTimeout(() => {
      this.newTaskSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.newTaskError = reason.message;
  }
}
