import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../schedule.config';

interface DeleteScheduleRes {
  data: { deleteSchedule: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'schedule-delete-schedule',
  templateUrl: './delete-schedule.component.html',
  styleUrls: ['./delete-schedule.component.css']
})
export class DeleteScheduleComponent implements OnInit, OnExec {
  @Input() id: string;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  deleteSchedule() {
    this.dvs.exec();
  }

  async dvOnExec() {
    const res = await this.dvs.post<DeleteScheduleRes>(this.apiPath, {
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
