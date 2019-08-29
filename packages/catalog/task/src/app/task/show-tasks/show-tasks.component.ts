import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit,
  SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { ShowTaskComponent } from '../show-task/show-task.component';

import { Task } from '../shared/task.model';

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';


@Component({
  selector: 'task-show-tasks',
  templateUrl: './show-tasks.component.html',
  styleUrls: ['./show-tasks.component.css']
})
export class ShowTasksComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();
  // Fetch rules
  // If undefined then the fetched tasks are not filtered by that property
  @Input() assigneeId: string | undefined;
  @Input() assignerId: string | undefined;

  @Input() approved: boolean | undefined;
  @Input() assigned: boolean | undefined;
  @Input() completed: boolean | undefined;

  // Show rules
  /* What fields of the task to show. These are passed as input
     to `showTask` */
  @Input() showId = true;
  @Input() showAssigner = true;
  @Input() showAssignee = true;
  @Input() showDueDate = true;
  @Input() showApproved = true;
  @Input() showCompleted = true;

  // Whether to show the user the option to {claim, complete, approve} a task
  // If given, it will show the the option to claim
  @Input() claimAssigneeId: string | undefined;
  @Input() showOptionToClaim = false;
  @Input() showOptionToComplete = false;
  @Input() showOptionToApprove = false;

  @Input() showTask: ComponentValue = {
    type: <Type<Component>> ShowTaskComponent
  };
  @Input() noTasksToShowText = 'No tasks to show';
  tasks: Task[] = [];

  showTasks;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {
    this.showTasks = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const field of this.waitOn) {
      if (changes[field] && !_.isNil(changes[field].currentValue)) {
        this.fieldChange.emit(field);
      }
    }
    // We should only reload iif what changed is something we are not
    // waiting on (because if ow we would send a double request)
    let shouldLoad = false;
    for (const fieldThatChanged of _.keys(changes)) {
      if (!this.activeWaits.has(fieldThatChanged)) {
        shouldLoad = true;
      }
    }
    if (shouldLoad) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      if (!_.isEmpty(this.waitOn)) {
        await Promise.all(_.chain(this.waitOn)
          .filter((field) => _.isNil(this[field]))
          .tap((fs) => {
            this.activeWaits = new Set(fs);

            return fs;
          })
          .map((fieldToWaitFor) => this.fieldChange
            .pipe(filter((field) => field === fieldToWaitFor), take(1))
            .toPromise())
          .value());
      }
      this.gs
        .get<{data: {tasks: Task[]}}>('/graphql', {
          params: {
            inputs: JSON.stringify({
              input: {
                assigneeId: this.assigneeId,
                assignerId: this.assignerId,
                approved: this.approved,
                assigned: this.assigned,
                completed: this.completed
              }
            }),
            extraInfo: {
              returnFields: `
                ${this.showId ? 'id' : ''}
                ${this.showAssigner ? 'assignerId' : ''}
                ${this.showAssignee ? 'assigneeId' : ''}
                ${this.showDueDate ? 'dueDate' : ''}
                ${this.showApproved ? 'approved' : ''}
                ${this.showCompleted ? 'completed' : ''}
              `
            }
          }
        })
        .subscribe((res) => {
          this.tasks = res.data.tasks;
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
