import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';
import * as _ from 'lodash';

import { ShowMessageComponent } from '../show-message/show-message.component';

import { API_PATH } from '../follow.config';
import { Message } from '../shared/follow.model';

interface MessagesRes {
  data: { messages: Message[] };
  errors: { message: string }[];
}

@Component({
  selector: 'follow-show-messages',
  templateUrl: './show-messages.component.html',
  styleUrls: ['./show-messages.component.css']
})
export class ShowMessagesComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  // Fetch rules
  // If undefined then the fetched messages are not filtered by that property
  @Input() ofPublishersFollowedById: string | undefined;
  @Input() byPublisherId: string | undefined;

  // Show rules
  /* What fields of the message to show. These are passed as input
     to `showMessage` */
  @Input() showId = true;
  @Input() showContent = true;

  @Input() showMessage: ComponentValue = {
    type: <Type<Component>> ShowMessageComponent
  };
  @Input() noMessagesToShowText = 'No messages to show';
  messages: Message[] = [];

  showMessages;
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showMessages = this;
  }

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
      const res = await this.dvs.get<MessagesRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              ofPublishersFollowedById: this.ofPublishersFollowedById,
              byPublisherId: this.byPublisherId
            }
          }),
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showContent ? 'content' : ''}
            `
          }
        }
      });
      this.messages = res.data.messages;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
