import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, Type,
  ViewChild
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';
import {
  Action, GatewayService, GatewayServiceFactory, OnExec, OnExecFailure,
  OnExecSuccess, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../task.config';

import { Task } from '../shared/task.model';

import {
  ShowAssigneeComponent
} from '../show-assignee/show-assignee.component';


interface CreateTasksForAssigneesRes {
  data: { createTasksForAssignees: Task[] };
  errors: { message: string }[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'task-create-tasks-for-assignees',
  templateUrl: './create-tasks-for-assignees.component.html',
  styleUrls: ['./create-tasks-for-assignees.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreateTasksForAssigneesComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreateTasksForAssigneesComponent,
      multi: true
    }
  ]
})
export class CreateTasksForAssigneesComponent implements OnInit, OnExec,
  OnExecFailure, OnExecSuccess {
  @Input() set assignerId(assignerId: string) {
    this.assignerControl.setValue(assignerId);
  }
  @Input()
  set assigneeIds(value: string[] | undefined) {
    if (value !== undefined) {
      this.assigneesControl.setValue(value);
    }
  }

  @Input()
  set assignees(value: { id: string }[] | undefined) {
    if (value !== undefined) {
      this.assigneesControl.setValue(_.map(value, 'id'));
    }
  }

  @Input() set dueDate(dueDate: string) {
    this.dueDateControl.setValue(dueDate);
  }

  @Input() showOptionToSubmit = true;
  @Input() showOptionToAddAssignees = true;
  @Input() showOptionToInputDueDate = true;
  @Input() showAssignee: Action = {
    type: <Type<Component>> ShowAssigneeComponent
  };

  @Input() stageHeader: Action | undefined;

  // Presentation inputs
  @Input() assignerLabel = 'Assigner Id';
  @Input() stageAssigneeButtonLabel = 'Add Assignee';
  @Input() buttonLabel = 'Create Tasks';
  @Input() newTasksSavedText = 'New tasks saved';

  @Output() stagedAssigneeIds = new EventEmitter<string[]>();


  @ViewChild(FormGroupDirective) form;
  dueDateControl = new FormControl('');
  assignerControl = new FormControl('', Validators.required);
  assigneesControl = new FormControl('', Validators.required);
  createTasksForAssigneesForm: FormGroup = this.builder.group({
    assigneesControl: this.assigneesControl,
    assignerControl: this.assignerControl,
    dueDateControl: this.dueDateControl
  });


  newTasksSaved = false;
  newTasksError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) {
    this.assigneesControl.valueChanges.subscribe((value) => {
      this.stagedAssigneeIds.emit(value);
    });
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<CreateTasksForAssigneesRes>(this.apiPath, {
      inputs: {
        input: {
          assignerId: this.assignerControl.value,
          assigneeIds: this.assigneesControl.value,
          dueDate: this.dueDateControl.value
        }
      },
      extraInfo: { returnFields: 'id' }
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnExecSuccess() {
    this.newTasksSaved = true;
    window.setTimeout(() => {
      this.newTasksSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.newTasksError = reason.message;
  }
}
