import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH } from '../chat.config';
import { Chat } from '../shared/chat.model';

interface ShowChatRes {
  data: { chat: Chat };
}


@Component({
  selector: 'chat-show-chat',
  templateUrl: './show-chat.component.html'
})
export class ShowChatComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // Provide one of the following: id or chat
  @Input() id: string | undefined;
  @Input() chat: Chat | undefined;
  @Output() loadedChat = new EventEmitter();

  @Input() showId = true;
  @Input() showContent = true;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) {}

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
      this.gs.get<ShowChatRes>(this.apiPath, {
        params: {
          inputs: {
            id: this.id
          },
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showContent ? 'content' : ''}
            `
          }
        },
      })
      .pipe(map((res: ShowChatRes) => res.data.chat))
      .subscribe((chat) => {
        this.chat = chat;
        this.loadedChat.emit(chat);
      });
    }
  }

  private canEval(): boolean {
    return !!(!this.chat && this.id && this.gs);
  }
}
