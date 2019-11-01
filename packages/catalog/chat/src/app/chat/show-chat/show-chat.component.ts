import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnDestroy, OnInit, Output, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { API_PATH, SUBSCRIPTIONS_PATH } from '../chat.config';
import { GraphQlMessage, Message, toMessage } from '../shared/chat.model';
import {
  ShowMessageComponent
} from '../show-message/show-message.component';


import * as _ from 'lodash';


interface ShowChatRes {
  data: { chatMessages: GraphQlMessage[] };
}


@Component({
  selector: 'chat-show-chat',
  templateUrl: './show-chat.component.html'
})
export class ShowChatComponent
  implements AfterViewInit, OnChanges, OnDestroy, OnEval, OnInit {
  // Provide one of the following: id or chat
  @Input() id: string | undefined;
  @Input() maxMessageCount = 0; // 0 for no limit
  @Input() chat: Message[] | undefined;
  @Output() loadedChat = new EventEmitter();

  @Input() showId = true;
  @Input() showMessageId = true;
  @Input() showMessageContent = true;
  @Input() showMessageTimestamp = true;
  @Input() showMessageAuthorId = true;
  @Input() showMessageChatId = true;

  @Input() showMessage: ComponentValue = {
    type: <Type<Component>> ShowMessageComponent
  };
  @Input() noMessagesToShowText = 'No messages yet';

  showChat;
  private shouldUpdate = false;
  private idOfLoadedChat;
  private dvs: DvService;
  private sub: Subscription;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath,
    @Inject(SUBSCRIPTIONS_PATH) private subscriptionsPath) {
    this.showChat = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
    // Note: there's no need for this component to subscribe to router updates
    // to refresh because it already reloads every time data changes on the
    // server.
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes) {
    if (changes['id'] && changes['id'].currentValue !== this.idOfLoadedChat) {
      this.shouldUpdate = true;
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.shouldUpdate = false;
      if (this.sub) {
        this.sub.unsubscribe();
      }
      const res = await this.dvs.get<ShowChatRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              chatId: this.id,
              maxMessageCount: this.maxMessageCount
            }
          },
          extraInfo: {
            returnFields: `
              id
              ${this.showMessageContent ? 'content' : ''}
              ${this.showMessageTimestamp ? 'timestamp' : ''}
              ${this.showMessageAuthorId ? 'authorId' : ''}
            `
          }
        }
      });
      if (res.data) {
        const chat: Message[] = res.data.chatMessages.map(toMessage);
        this.chat = chat;
        this.loadedChat.emit(chat);
        this.idOfLoadedChat = this.id;

        this.sub = this.dvs.subscribe<any>(this.subscriptionsPath, {
          inputs: { chatId: this.id }
        })
        .subscribe((subRes) => {
          if (subRes.errors) {
            throw new Error(_.map(subRes.errors, 'message')
              .join());
          }
          this.shouldUpdate = true;
          this.load();
        });
      }
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!((!this.chat || this.shouldUpdate) && this.id && this.dvs);
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
