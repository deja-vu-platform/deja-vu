import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnRun, RunService
} from 'dv-core';


@Component({
  selector: 'group-create-member',
  templateUrl: './create-member.component.html',
  styleUrls: ['./create-member.component.css']
})
export class CreateMemberComponent implements OnInit {
  @Input() id: string | undefined;
  @Input() buttonLabel = 'Create Member';
  @Input() inputLabel = 'Id';
  @Output() member = new EventEmitter();

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
      data: { createMember: { id: string }}
    }>('/graphql', {
      query: `mutation {
        createMember(id: "${this.id}") {
          id
        }
      }`
    })
    .toPromise();
    this.member.emit({id: res.data.createMember.id});
  }
}
