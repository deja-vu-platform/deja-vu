import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../follow.config';

import * as _ from 'lodash';

interface MessageCountRes {
  data: { messageCount: number };
}

@Component({
  selector: 'follow-show-message-count',
  templateUrl: './show-message-count.component.html'
})
export class ShowMessageCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  messageCount: number;

  @Input() ofPublishersFollowedById: string | undefined;
  @Input() byPublisherId: string | undefined;

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
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<MessageCountRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              byPublisherId: this.byPublisherId,
              ofPublishersFollowedById: this.ofPublishersFollowedById
            }
          }
        }
      })
        .pipe(map((res: MessageCountRes) => res.data.messageCount))
        .subscribe((messageCount) => {
          this.messageCount = messageCount;
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
