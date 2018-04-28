import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import { ShowMessageComponent } from '../show-message/show-message.component';

import { Message } from '../shared/follow.model';


@Component({
  selector: 'follow-show-messages',
  templateUrl: './show-messages.component.html',
  styleUrls: ['./show-messages.component.css']
})
export class ShowMessagesComponent implements OnInit, OnChanges {
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
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.showMessages = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchMessages();
  }

  ngOnChanges() {
    this.fetchMessages();
  }

  fetchMessages() {
    if (this.gs) {
      this.gs
        .get<{data: {messages: Message[]}}>('/graphql', {
          params: {
            query: `
              query Messages($input: MessagesInput!) {
                messages(input: $input) {
                  ${this.showId ? 'id' : ''}
                  ${this.showContent ? 'content' : ''}
                }
              }
            `,
            variables: JSON.stringify({
              input: {
                ofPublishersFollowedById: this.ofPublishersFollowedById,
                byPublisherId: this.byPublisherId
              }
            })
          }
        })
        .subscribe((res) => {
          this.messages = res.data.messages;
        });
    }
  }
}
