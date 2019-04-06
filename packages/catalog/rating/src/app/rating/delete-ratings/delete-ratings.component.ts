import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../rating.config';

interface DeleteRatingsRes {
  data: { deleteRatings: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'rating-delete-ratings',
  templateUrl: './delete-ratings.component.html',
  styleUrls: ['./delete-ratings.component.css']
})
export class DeleteRatingsComponent implements OnInit, OnExec {
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

  deleteRatings() {
    this.rs.exec(this.elem);
  }

  async dvOnExec() {
    if (this.canExec()) {
      const res = await this.gs.post<DeleteRatingsRes>(this.apiPath, {
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
    } else {
      throw new Error('Must include either sourceId, targetId or both');
    }
  }

  private canExec() {
    return this.sourceId || this.targetId;
  }
}
