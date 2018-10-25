import { Component, ElementRef, Input, OnInit } from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnExecCommit, OnExec,
  RunService
} from 'dv-core';


@Component({
  selector: 'task-approve-task',
  templateUrl: './approve-task.component.html',
  styleUrls: ['./approve-task.component.css']
})
export class ApproveTaskComponent implements
  OnInit, OnExec, OnExecCommit  {
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
    this.rs.exec(this.elem);
  }

  dvOnExec(): Promise<{data: any}> {
    return this.gs
      .post<{data: any}>('/graphql', {
        query: `mutation {
          approveTask(id: "${this.id}") {
            id
          }
        }`
      })
      .toPromise();
  }

  dvOnExecCommit() {
    this.disabled = true;
  }
}
