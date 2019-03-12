import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../comment.config';
import { Comment } from '../shared/comment.model';

import * as _ from 'lodash';

interface CommentCountRes {
  data: { commentCount: number };
}

@Component({
  selector: 'comment-show-comment-count',
  templateUrl: './show-comment-count.component.html'
})
export class ShowCommentCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  public commentCount: number;

  @Input() byAuthorId: string | undefined;
  @Input() ofTargetId: string | undefined;

  @Input() commentIds: string[] | undefined;
  @Input() set comments(value: Comment[]) {
    this.commentIds = _.map(value, 'id');
  }

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    } else {
      this.commentCount = this.commentIds.length;
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<CommentCountRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              byAuthorId: this.byAuthorId,
              ofTargetId: this.ofTargetId
            }
          }
        }
      })
        .pipe(map((res: CommentCountRes) => res.data.commentCount))
        .subscribe((commentCount) => {
          this.commentCount = commentCount;
        });
    }
  }

  private canEval(): boolean {
    return !!(!this.commentIds && this.gs);
  }
}
