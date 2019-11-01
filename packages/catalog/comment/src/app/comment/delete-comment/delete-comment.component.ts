import { Component, ElementRef, Inject, Input, OnInit } from '@angular/core';
import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../comment.config';

interface DeleteCommentRes {
  data: { deleteComment: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'comment-delete-comment',
  templateUrl: './delete-comment.component.html',
  styleUrls: ['./delete-comment.component.css']
})
export class DeleteCommentComponent implements OnInit, OnExec {
  @Input() id: string;
  @Input() authorId: string;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  deleteComment() {
    this.dvs.exec();
  }

  async dvOnExec() {
    const res = await this.dvs.post<DeleteCommentRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          authorId: this.authorId
        }
      }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }
}
