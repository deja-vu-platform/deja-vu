import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../match.config';

interface DeleteMatchRes {
  data: { deleteMatch: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'match-delete-match',
  templateUrl: './delete-match.component.html',
  styleUrls: ['./delete-match.component.css']
})
export class DeleteMatchComponent implements OnInit, OnExec {
  @Input() id: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  deleteMatch() {
    this.rs.exec(this.elem);
  }

  async dvOnExec() {
    const res = await this.gs.post<DeleteMatchRes>(this.apiPath, {
        inputs: {
          id: this.id
        }
      })
      .toPromise();

      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }
  }
}
