import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../task.config';

import * as _ from 'lodash';

interface TaskCountRes {
  data: { taskCount: number };
}

@Component({
  selector: 'task-show-task-count',
  templateUrl: './show-task-count.component.html'
})
export class ShowTaskCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  taskCount: number;

  @Input() assigneeId: string | undefined;
  @Input() assignerId: string | undefined;

  @Input() approved: boolean | undefined;
  @Input() assigned: boolean | undefined;
  @Input() completed: boolean | undefined;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<TaskCountRes>(this.apiPath, {
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
      })
        .pipe(map((res: TaskCountRes) => res.data.taskCount))
        .subscribe((taskCount) => {
          this.taskCount = taskCount;
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
