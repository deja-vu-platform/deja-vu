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

/**
 * Creates one task with the same properties for each assignee
 */
@Component({
  selector: 'task-create-task-for-all-assignees',
  templateUrl: './create-task-for-all-assignees.component.html',
  styleUrls: ['./create-task-for-all-assignees.component.css']
})
export class CreateTaskForAllAssigneesComponent
  implements OnInit, OnRun, OnAfterCommit {
  @Input() taskId;
  @Input() assignerId;

  // Presentation inputs
  @Input() buttonLabel = 'Create Task';
  @Input() newTaskSavedText = 'New task saved';

  @ViewChild(FormGroupDirective) form;

  createTaskForAllAssigneesForm: FormGroup = this.builder.group({});

  dueDate: string;

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
      query: `mutation CreateTaskForAllAssignees($input: CreateTaskInput!) {
        createTaskForAllAssignees(input: $input) {
          id
        }
      }`,
      variables: {
        input: {
          assignerId: this.assignerId,
          dueDate: this.dueDate
        }
      }
    })
    .toPromise();

    return res.data.createTaskForAllAssignees.id;
  }

  dvOnAfterCommit() {
    this.newTaskSaved = true;
    window.setTimeout(() => {
      this.newTaskSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.newWeeklyEventForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.newTaskError = reason.message;
  }
}
