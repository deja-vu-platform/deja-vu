import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import { map } from 'rxjs/operators';

import { Assignee, Task } from '../shared/task.model';


const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'task-update-task',
  templateUrl: './update-task.component.html',
  styleUrls: ['./update-task.component.css']
})
export class UpdateTaskComponent implements OnInit, OnChanges {
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

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.loadTask();
  }

  ngOnChanges() {
    this.loadTask();
  }

  loadTask() {
    if (!this.gs || !this.id) {
      return;
    }
    this.gs.get<{data: {task: Task}}>('/graphql', {
      params: {
        query: `
          query {
            task(id: "${this.id}") {
              id
              assignee { id }
              dueDate
            }
          }
        `
      }
    })
    .pipe(map((res) => res.data.task))
    .subscribe((task: Task) => {
      this.assignee.setValue(task.assignee);
      this.dueDate.setValue(task.dueDate);
    });
  }


  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<string> {
    const res = await this.gs.post<{data: any}>('/graphql', {
      query: `mutation UpdateTask($input: UpdateTaskInput!) {
        updateTask(input: $input) {
          id
        }
      }`,
      variables: {
        input: {
          id: this.id,
          assigneeId: this.assignee.value.id,
          dueDate: this.dueDate.value
        }
      }
    })
    .toPromise();

    return res.data.updateTask.id;
  }

  dvOnAfterCommit() {
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

  dvOnAfterAbort(reason: Error) {
    this.taskError = reason.message;
  }
}
