import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../comment.config';

import * as _ from 'lodash';

interface CommentCountRes {
  data: { commentCount: number };
}

@Component({
  selector: 'comment-show-comment-count',
  templateUrl: './show-comment-count.component.html'
})
export class ShowCommentCountComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  commentCount: number;

  @Input() byAuthorId: string | undefined;
  @Input() ofTargetId: string | undefined;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.get<CommentCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              byAuthorId: this.byAuthorId,
              ofTargetId: this.ofTargetId
            }
          })
        }
      });
      this.commentCount = res.data.commentCount;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
