import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import { ShowTaskComponent } from '../show-task/show-task.component';

import { Task } from '../shared/task.model';


@Component({
  selector: 'task-show-tasks',
  templateUrl: './show-tasks.component.html',
  styleUrls: ['./show-tasks.component.css']
})
export class ShowTasksComponent implements OnInit, OnChanges {
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
  // Requires assigneeId
  @Input() showOptionToClaim = false;
  @Input() showOptionToComplete = false;
  @Input() showOptionToApprove = false;

  @Input() showTask: Action = {
    type: <Type<Component>> ShowTaskComponent
  };
  tasks: Task[] = [];

  showTasks;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.showTasks = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchTasks();
  }

  ngOnChanges() {
    this.fetchTasks();
  }

  fetchTasks() {
    if (this.gs) {
      this.gs
        .get<{data: {tasks: Task[]}}>('/graphql', {
          params: {
            query: `
              query Tasks($input: TasksInput!) {
                tasks(input: $input) {
                  ${this.showId ? 'id' : ''}
                  ${this.showAssigner ? 'assigner { id }' : ''}
                  ${this.showAssignee ? 'assignee { id }' : ''}
                  ${this.showDueDate ? 'dueDate' : ''}
                  ${this.showApproved ? 'approved' : ''}
                  ${this.showCompleted ? 'completed' : ''}
                }
              }
            `,
            variables: JSON.stringify({
              input: {
                assigneeId: this.assigneeId,
                assignerId: this.assignerId,
                approved: this.approved,
                assigned: this.assigned,
                completed: this.completed
              }
            })
          }
        })
        .subscribe((res) => {
          this.tasks = res.data.tasks;
        });
    }
  }
}
