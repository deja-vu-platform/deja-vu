import { Component, ElementRef, Input, OnInit } from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecSuccess,
  RunService
} from 'dv-core';


@Component({
  selector: 'task-claim-task',
  templateUrl: './claim-task.component.html',
  styleUrls: ['./claim-task.component.css']
})
export class ClaimTaskComponent implements
  OnInit, OnExec, OnExecSuccess  {
  @Input() id;
  @Input() assigneeId;
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
    this.rs.exec(this.elem);
  }

  dvOnExec(): Promise<{data: any}> {
    return this.gs
      .post<{data: any}>('/graphql', {
        query: `mutation {
          claimTask(
            id: "${this.id}",
            assigneeId: "${this.assigneeId}") {
            id
          }
        }`
      })
      .toPromise();
  }

  dvOnExecSuccess() {
    this.disabled = true;
  }
}
