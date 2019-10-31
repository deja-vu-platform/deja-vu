import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../follow.config';

import * as _ from 'lodash';

interface MessageCountRes {
  data: { messageCount: number };
}

@Component({
  selector: 'follow-show-message-count',
  templateUrl: './show-message-count.component.html'
})
export class ShowMessageCountComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  messageCount: number;

  @Input() ofPublishersFollowedById: string | undefined;
  @Input() byPublisherId: string | undefined;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

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
      const res = await this.dvs.get<MessageCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              byPublisherId: this.byPublisherId,
              ofPublishersFollowedById: this.ofPublishersFollowedById
            }
          })
        }
      });
      this.messageCount = res.data.messageCount;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
