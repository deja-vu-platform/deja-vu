import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../scoring.config';

interface DeleteScoreRes {
  data: { deleteScore: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'scoring-delete-score',
  templateUrl: './delete-score.component.html',
  styleUrls: ['./delete-score.component.css']
})
export class DeleteScoreComponent implements OnInit, OnExec {
  @Input() id: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  deleteScore() {
    this.rs.exec(this.elem);
  }

  async dvOnExec() {
    const res = await this.gs.post<DeleteScoreRes>(this.apiPath, {
        inputs: {
          input: {
            id: this.id
          }
        }
      })
      .toPromise();

      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }
  }
}
