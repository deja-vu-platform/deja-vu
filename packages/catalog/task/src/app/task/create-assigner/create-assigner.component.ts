import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnRun, RunService
} from 'dv-core';


@Component({
  selector: 'task-create-assigner',
  templateUrl: './create-assigner.component.html',
  styleUrls: ['./create-assigner.component.css']
})
export class CreateAssignerComponent implements OnInit, OnRun {
  @Input() id: string | undefined;
  @Input() buttonLabel = 'Create Assigner';
  @Input() inputLabel = 'Id';
  @Output() assigner = new EventEmitter();

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
      data: { createAssigner: { id: string }}
    }>('/graphql', {
      query: `mutation {
        createAssigner(id: "${this.id}") {
          id
        }
      }`
    })
    .toPromise();
    this.assigner.emit({id: res.data.createAssigner.id});
  }
}
