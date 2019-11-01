import { Component, ElementRef, Inject, Input, OnInit } from '@angular/core';
import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../match.config';

interface WithdrawAttemptRes {
  data: { withdrawAttempt: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'match-withdraw-attempt',
  templateUrl: './withdraw-attempt.component.html',
  styleUrls: ['./withdraw-attempt.component.css']
})
export class WithdrawAttemptComponent implements OnInit, OnExec {
  @Input() id: string;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  withdrawAttempt() {
    this.dvs.exec();
  }

  async dvOnExec() {
    const res = await this.dvs.post<WithdrawAttemptRes>(this.apiPath, {
      inputs: {
        id: this.id
      }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }
}
