import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';

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

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  deleteScore() {
    this.dvs.exec();
  }

  async dvOnExec() {
    const res = await this.dvs.post<DeleteScoreRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id
        }
      }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }
}
