import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../rating.config';

interface DeleteRatingRes {
  data: { deleteRating: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'rating-delete-rating',
  templateUrl: './delete-rating.component.html',
  styleUrls: ['./delete-rating.component.css']
})
export class DeleteRatingComponent implements OnInit, OnExec {
  @Input() sourceId: string;
  @Input() targetId: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  deleteRating() {
    this.rs.exec(this.elem);
  }

  async dvOnExec() {
    const res = await this.gs.post<DeleteRatingRes>(this.apiPath, {
        inputs: {
          input: {
            bySourceId: this.sourceId,
            ofTargetId: this.targetId
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
