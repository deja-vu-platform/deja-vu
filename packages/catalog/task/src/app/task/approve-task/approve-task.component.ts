import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';


@Component({
  selector: 'task-approve-task',
  templateUrl: './approve-task.component.html',
  styleUrls: ['./approve-task.component.css']
})
export class ApproveTaskComponent implements
  OnInit, OnRun, OnAfterCommit  {
  @Input() id = '';
  @Input() disabled = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onClick() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs
      .post<{data: any}>('/graphql', {
        query: `mutation {
          approveTask(id: "${this.id}") {
            id
          }
        }`
      })
      .toPromise();
  }

  dvOnAfterCommit() {
    this.disabled = true;
  }
}
