import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { DvService, DvServiceFactory, OnExec, RunService } from '@deja-vu/core';

import * as _ from 'lodash';

@Component({
  selector: 'group-delete-group',
  templateUrl: './delete-group.component.html',
  styleUrls: ['./delete-group.component.css']
})
export class DeleteGroupComponent implements OnInit, OnExec {
  @Input() id: string;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef,
    private readonly dvf: DvServiceFactory) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  deleteGroup() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    const res = await this.dvs
      .post<{ data: any, errors: { message: string }[] }>('/graphql', {
        inputs: { id: this.id }
      });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }
}
