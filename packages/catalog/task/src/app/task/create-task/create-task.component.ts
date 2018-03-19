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

import { Assignee } from '../shared/task.model';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'task-create-task',
  templateUrl: './create-task.component.html',
  styleUrls: ['./create-task.component.css']
})
export class CreateTaskComponent implements OnInit, OnRun, OnAfterCommit {
  @Input() id;
  @Input() assignerId;

  // Presentation inputs
  @Input() assigneeSelectPlaceholder = 'Choose Assignee';
  @Input() buttonLabel = 'Create Task';
  @Input() newTaskSavedText = 'New task saved';

  @ViewChild(FormGroupDirective) form;

  assignee = new FormControl('');
  dueDate = new FormControl('');
  createTaskForm: FormGroup = this.builder.group({
    assignee: this.assignee,
    dueDate: this.dueDate
  });


  newTaskSaved = false;
  newTaskError: string;

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
      query: `mutation CreateTask($input: CreateTaskInput!) {
        createTask(input: $input) {
          id
        }
      }`,
      variables: {
        input: {
          id: this.id,
          assignerId: this.assignerId,
          assigneeId: this.assignee.value.id,
          dueDate: this.dueDate.value
        }
      }
    })
    .toPromise();
  }

  dvOnAfterCommit() {
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

  dvOnAfterAbort(reason: Error) {
    this.newTaskError = reason.message;
  }
}
