import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../task.config';

import * as _ from 'lodash';

interface TaskCountRes {
  data: { taskCount: number };
}

@Component({
  selector: 'task-show-task-count',
  templateUrl: './show-task-count.component.html'
})
export class ShowTaskCountComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  taskCount: number;

  @Input() assigneeId: string | undefined;
  @Input() assignerId: string | undefined;

  @Input() approved: boolean | undefined;
  @Input() assigned: boolean | undefined;
  @Input() completed: boolean | undefined;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) { }

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
    if (this.canEval()) {
      const res = await this.dvs.get<TaskCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              assigneeId: this.assigneeId,
              assignerId: this.assignerId,
              approved: this.approved,
              assigned: this.assigned,
              completed: this.completed
            }
          })
        }
      });
      this.taskCount = res.data.taskCount;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
