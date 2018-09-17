import {
  Component, ElementRef, Input, OnInit
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';


@Component({
  selector: 'task-complete-task',
  templateUrl: './complete-task.component.html',
  styleUrls: ['./complete-task.component.css']
})
export class CompleteTaskComponent implements
  OnInit, OnRun, OnAfterCommit  {
  @Input() id;
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

  dvOnRun(): Promise<{data: any}> {
    return this.gs
      .post<{data: any}>('/graphql', {
        query: `mutation {
          completeTask(id: "${this.id}") {
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
