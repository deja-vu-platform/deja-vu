import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from 'dv-core';

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

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  deleteComment() {
    this.rs.exec(this.elem);
  }

  async dvOnExec() {
    const res = await this.gs.post<DeleteCommentRes>(this.apiPath, {
        query: `mutation DeleteComment($input: DeleteCommentInput!) {
          deleteComment(input: $input)
        }`,
        inputs: {
          input: {
            id: this.id,
            authorId: this.authorId
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
