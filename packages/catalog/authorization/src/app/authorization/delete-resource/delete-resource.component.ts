import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../authorization.config';


@Component({
  selector: 'authorization-delete-resource',
  templateUrl: './delete-resource.component.html',
  styleUrls: ['./delete-resource.component.css']
})
export class DeleteResourceComponent implements OnInit, OnExec {
  @Input() id: string;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  deleteResource() {
    this.dvs.exec();
  }

  async dvOnExec() {
    await this.dvs.post(this.apiPath, {
      inputs: { id: this.id }
    });
  }
}
