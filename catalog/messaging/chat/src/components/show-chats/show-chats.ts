import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/map";

import {Widget, ClientBus, Field, PrimitiveAtom, AfterInit} from "client-bus";
import {ChatAtom, MessageAtom, UserAtom} from "../../shared/data";


@Widget({fqelement: "Chat", ng2_providers: [GraphQlService]})
export class ShowChatsComponent implements AfterInit {
  @Field("User") user: UserAtom;
  chats: ChatAtom[];
  selectedChat: ChatAtom;

  private fetched: string;

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    if (this.user.atom_id) {
      this.fetchChatPreviews();
    }

    this.user.on_change(() => this.fetchChatPreviews());
    this.selectedChat.on_change(() => this.fetchChatMessages());
    // TODO: load more chat messages when scrolling up?
    // TOOD: handle incoming messages
  }

  selectChat(chat: ChatAtom) {
    this.selectedChat = chat;
  }

  sendMessage(chat: ChatAtom, message: string) {
    // TODO: disallow message that contains only whitespace?
    if (message) {
      const timestamp = Date.now();
      this._graphQlService
      .post(`
        sendMessage(
          chat: "${chat.atom_id}",
          author: "${this.user.atom_id}",
          content: "${message}",
          timestamp: ${timestamp}
        )
      `)
      .map(data => data.sendMessage)
      .subscribe(messageAtomId => {
        const message_atom = this._clientBus.new_atom<MessageAtom>("Message");
        message_atom.atom_id = messageAtomId;
        const author_atom = this._clientBus.new_atom<UserAtom>("User");
        author_atom.atom_id = this.user.atom_id;
        author_atom.username = this.user.username;
        message_atom.author = author_atom;
        message_atom.content = message;
        // TODO: check if this date is formatted right
        message_atom.timestamp = new Date(timestamp).toLocaleString();

        chat.messages.push(message_atom);
      })
    }
  }

  private fetchChatPreviews() {
    if (this.user.atom_id && this.fetched !== this.user.atom_id) {
      this.chats = [];
      this.fetched = this.user.atom_id;
      this._graphQlService
      .get(`
        userChats(user: "${this.user.atom_id}") {
          atom_id,
          users { atom_id, username },
          messages { atom_id, author, content, timestamp }
        }
      `)
      .map(data => data.userChats)
      .flatMap((chats, unused_ix) => Observable.from(chats))
      .map((chat: ChatAtom) => {
        const chat_atom = this._clientBus.new_atom<ChatAtom>("Chats");
        chat_atom.atom_id = chat.atom_id;

        chat_atom.users = chat.users.map((user: UserAtom) => {
          const user_atom = this._clientBus.new_atom<UserAtom>("User");
          user_atom.atom_id = user.atom_id;
          user_atom.username = user.username;
          return user_atom;
        });

        chat_atom.messages = chat.messages.map(this.getMessageAtom);
        return chat_atom;
      })
      .subscribe(chat => {
        this.chats.push(chat);
      });
    }
  }

  private fetchChatMessages() {
    if (this.selectedChat.atom_id) {
      this._graphQlService
      .get(`
        chatMessages(
          chat: "${this.selectedChat.atom_id}",
          prev_length: ${this.selectedChat.messages.length},
          new_length: 15
        ) {
          atom_id, author, content, timestamp
        }
      `)
      .map(data => data.chatMessages)
      .flatMap((messages, unused_ix) => Observable.from(messages))
      .map((message: MessageAtom) => {
        return this.getMessageAtom(message);
      })
      .subscribe(message => {
        this.selectedChat.messages.push(message);
      });
    }
  }

  private getMessageAtom(message: MessageAtom): MessageAtom {
    const message_atom = this._clientBus.new_atom<MessageAtom>("Message");
    message_atom.atom_id = message.atom_id;
    const author_atom = this._clientBus.new_atom<UserAtom>("User");
    author_atom.atom_id = message.author.atom_id;
    author_atom.username = message.author.username
    message_atom.author = author_atom;
    message_atom.content = message.content;
    message_atom.timestamp = message.timestamp; // TODO: format timestamp
    return message_atom;
  }
}
