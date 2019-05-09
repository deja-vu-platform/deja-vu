import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH, SUBSCRIPTIONS_PATH } from '../chat.config';
import { GraphQlMessage, Message, toMessage } from '../shared/chat.model';
import { ShowMessageComponent } from '../show-message/show-message.component';

import * as _ from 'lodash';


interface ShowChatRes {
  data: { chatMessages: GraphQlMessage[] };
}


@Component({
  selector: 'chat-show-chat',
  templateUrl: './show-chat.component.html'
})
export class ShowChatComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // Provide one of the following: id or chat
  @Input() id: string | undefined;
  @Input() maxMessageCount: number = 0; // 0 for no limit
  @Input() chat: Message[] | undefined;
  @Output() loadedChat = new EventEmitter();

  @Input() showId = true;
  @Input() showMessageId = true;
  @Input() showMessageContent = true;
  @Input() showMessageTimestamp = true;
  @Input() showMessageAuthorId = true;
  @Input() showMessageChatId = true;

  @Input() showMessage: Action = {
    type: <Type<Component>> ShowMessageComponent
  };
  @Input() noMessagesToShowText = 'No messages yet';

  showChat;
  private shouldUpdate = false;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath,
    @Inject(SUBSCRIPTIONS_PATH) private subscriptionsPath) {
    this.showChat = this;
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
      this.shouldUpdate = false;
      this.gs.get<ShowChatRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              chatId: this.id,
              maxMessageCount: this.maxMessageCount
            }
          },
          extraInfo: {
            returnFields: `
              ${this.showMessageId ? 'id' : ''}
              ${this.showMessageContent ? 'content' : ''}
              ${this.showMessageTimestamp ? 'timestamp' : ''}
              ${this.showMessageAuthorId ? 'authorId' : ''}
            `
          }
        },
      })
      .subscribe((res: ShowChatRes) => {
        if (res.data) {
          const chat: Message[] = res.data.chatMessages.map(toMessage);
          this.chat = chat;
          this.loadedChat.emit(chat);

          this.gs.subscribe<any>(this.subscriptionsPath, {
            inputs: { chatId: this.id }
          })
          .subscribe((res) => {
            if (res.errors) {
              throw new Error(_.map(res.errors, 'message')
                .join());
            }
            this.shouldUpdate = true;
            this.load();
          });
        }
      });
    }
  }

  private canEval(): boolean {
    return !!((!this.chat || this.shouldUpdate) && this.id && this.gs);
  }
}
