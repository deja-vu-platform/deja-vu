import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../chat.config';

interface DeleteMessageRes {
  data: { deleteMessage: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'chat-delete-message',
  templateUrl: './delete-message.component.html',
  styleUrls: ['./delete-message.component.css']
})
export class DeleteMessageComponent implements OnInit, OnExec {
  @Input() id: string;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  deleteMessage() {
    this.dvs.exec();
  }

  async dvOnExec() {
    const res = await this.dvs.post<DeleteMessageRes>(this.apiPath, {
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
