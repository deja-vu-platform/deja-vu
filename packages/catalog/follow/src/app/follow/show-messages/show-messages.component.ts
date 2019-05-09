import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
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
export class ShowMessagesComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  // Fetch rules
  // If undefined then the fetched messages are not filtered by that property
  @Input() ofPublishersFollowedById: string | undefined;
  @Input() byPublisherId: string | undefined;

  // Show rules
  /* What fields of the message to show. These are passed as input
     to `showMessage` */
  @Input() showId = true;
  @Input() showContent = true;

  @Input() showMessage: Action = {
    type: <Type<Component>> ShowMessageComponent
  };
  @Input() noMessagesToShowText = 'No messages to show';
  messages: Message[] = [];

  showMessages;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showMessages = this;
  }

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
      this.gs
        .get<MessagesRes>(this.apiPath, {
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
        })
        .subscribe((res) => {
          this.messages = res.data.messages;
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
