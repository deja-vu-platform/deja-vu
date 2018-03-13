import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnRun, RunService
} from 'dv-core';


@Component({
  selector: 'task-create-assignee',
  templateUrl: './create-assignee.component.html',
  styleUrls: ['./create-assignee.component.css']
})
export class CreateAssigneeComponent implements OnInit, OnRun {
  @Input() id: string | undefined;
  @Input() buttonLabel = 'Create Assignee';
  @Input() inputLabel = 'Id';
  @Output() assignee = new EventEmitter();

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{
      data: { createAssignee: { id: string }}
    }>('/graphql', {
      query: `mutation {
        createAssignee(id: "${this.id}") {
          id
        }
      }`
    })
    .toPromise();
    this.assignee.emit({id: res.data.createAssignee.id});
  }
}
