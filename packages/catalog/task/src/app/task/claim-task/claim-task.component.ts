import {
  Component, ElementRef, EventEmitter, Input, OnInit
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';


@Component({
  selector: 'task-claim-task',
  templateUrl: './claim-task.component.html',
  styleUrls: ['./claim-task.component.css']
})
export class ClaimTaskComponent implements
  OnInit, OnRun, OnAfterCommit  {
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
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs
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

  dvOnAfterCommit() {
    this.disabled = true;
  }
}
