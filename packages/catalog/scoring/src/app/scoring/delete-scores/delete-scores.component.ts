import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../scoring.config';

interface DeleteScoresRes {
  data: { deleteScores: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'scoring-delete-scores',
  templateUrl: './delete-scores.component.html',
  styleUrls: ['./delete-scores.component.css']
})
export class DeleteScoresComponent implements OnInit, OnExec {
  @Input() sourceId: string | undefined;
  @Input() targetId: string | undefined;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  deleteScores() {
    this.rs.exec(this.elem);
  }

  async dvOnExec() {
    const res = await this.gs.post<DeleteScoresRes>(this.apiPath, {
        inputs: {
          input: {
            sourceId: this.sourceId,
            targetId: this.targetId
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
