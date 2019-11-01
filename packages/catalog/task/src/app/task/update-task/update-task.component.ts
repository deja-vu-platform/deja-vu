import {
  AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective
} from '@angular/forms';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import { Task } from '../shared/task.model';


const SAVED_MSG_TIMEOUT = 3000;


interface TaskRes {
  data: { task: Task };
}

@Component({
  selector: 'task-update-task',
  templateUrl: './update-task.component.html',
  styleUrls: ['./update-task.component.css']
})
export class UpdateTaskComponent
  implements AfterViewInit, OnInit, OnChanges, OnExec, OnExecFailure,
    OnExecSuccess {
  @Input() id;

  // Presentation inputs
  @Input() buttonLabel = 'Update Task';
  @Input() taskSavedText = 'Task saved';

  @ViewChild(FormGroupDirective) form;

  assignee = new FormControl('');
  dueDate = new FormControl('');
  updateTaskForm: FormGroup = this.builder.group({
    assignee: this.assignee,
    dueDate: this.dueDate
  });

  taskSaved = false;
  taskError: string;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    const res = await this.dvs.get<TaskRes>('/graphql', {
      params: {
        inputs: { id: this.id },
        extraInfo: {
          action: 'load',
          returnFields: `
            id
            assigneeId
            dueDate
          `
        }
      }
    });
    const task = res.data.task;
    if (task) {
      this.assignee.setValue(task.assigneeId);
      this.dueDate.setValue(task.dueDate);
    }
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<string> {
    const res = await this.dvs.post<{ data: any }>('/graphql', {
      inputs: {
        input: {
          id: this.id,
          assigneeId: this.assignee.value,
          dueDate: this.dueDate.value
        }
      },
      extraInfo: { action: 'update' }
    });

    return res.data.updateTask.id;
  }

  dvOnExecSuccess() {
    this.taskSaved = true;
    window.setTimeout(() => {
      this.taskSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.updateTaskForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.taskError = reason.message;
  }

  private canEval(): boolean {
    return !this.dvs || !this.id;
  }
}
