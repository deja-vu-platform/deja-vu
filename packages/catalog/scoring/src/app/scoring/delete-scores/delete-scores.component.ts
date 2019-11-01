import { Component, ElementRef, Inject, Input, OnInit } from '@angular/core';
import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';

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

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  deleteScores() {
    this.dvs.exec();
  }

  async dvOnExec() {
    const res = await this.dvs.post<DeleteScoresRes>(this.apiPath, {
      inputs: {
        input: {
          sourceId: this.sourceId,
          targetId: this.targetId
        }
      }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }
}
