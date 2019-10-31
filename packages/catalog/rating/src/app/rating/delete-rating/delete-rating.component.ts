import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';

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

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  deleteRating() {
    this.dvs.exec();
  }

  async dvOnExec() {
    const res = await this.dvs.post<DeleteRatingRes>(this.apiPath, {
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
  }
}
