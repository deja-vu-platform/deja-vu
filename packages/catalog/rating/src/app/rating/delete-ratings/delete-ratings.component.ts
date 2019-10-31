import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';

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

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  deleteRatings() {
    this.dvs.exec();
  }

  async dvOnExec() {
    if (this.canExec()) {
      const res = await this.dvs.post<DeleteRatingsRes>(this.apiPath, {
        inputs: {
          input: {
            bySourceId: this.sourceId,
            ofTargetId: this.targetId
          }
        }
      });

      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }
    } else {
      throw new Error('Must include either sourceId or targetId');
    }
  }

  private canExec() {
    return this.sourceId || this.targetId;
  }
}
