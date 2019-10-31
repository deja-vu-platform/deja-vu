import { Component, ElementRef, Input, OnInit } from '@angular/core';

import {
  DvService, DvServiceFactory, OnExec, OnExecSuccess
} from '@deja-vu/core';


@Component({
  selector: 'task-claim-task',
  templateUrl: './claim-task.component.html',
  styleUrls: ['./claim-task.component.css']
})
export class ClaimTaskComponent
  implements OnInit, OnExec, OnExecSuccess  {
  @Input() id;
  @Input() assigneeId;
  @Input() disabled = false;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef,
    private readonly dvf: DvServiceFactory) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  onClick() {
    this.dvs.exec();
  }

  dvOnExec(): Promise<{data: any}> {
    return this.dvs
      .post<{data: any}>('/graphql', {
        inputs: {
          id: this.id,
          assigneeId: this.assigneeId
        }
      });
  }

  dvOnExecSuccess() {
    this.disabled = true;
  }
}
