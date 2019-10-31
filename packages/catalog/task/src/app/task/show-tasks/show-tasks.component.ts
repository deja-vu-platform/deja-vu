import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges,
  OnDestroy, OnInit, SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { ShowTaskComponent } from '../show-task/show-task.component';

import { Task } from '../shared/task.model';

import * as _ from 'lodash';


@Component({
  selector: 'task-show-tasks',
  templateUrl: './show-tasks.component.html',
  styleUrls: ['./show-tasks.component.css']
})
export class ShowTasksComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges, OnDestroy {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
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
  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory) {
    this.showTasks = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .withRefreshCallback(() => { this.load(); })
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs
        .waitAndGet<{data: {tasks: Task[]}}>('/graphql', () => ({
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
        }));
        this.tasks = res.data.tasks;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
