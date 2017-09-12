import {Injectable} from "@angular/core";

import {ClientBus, isAtom} from "client-bus";

import {
  Follower,
  FollowerAtom,
  Publisher,
  PublisherAtom,
  Message,
  MessageAtom
} from "./data";


@Injectable()
export default class Atomize {
  constructor(private _clientBus: ClientBus) {}

  atomizeFollower(follower: Follower): FollowerAtom {
    const follower_atom = this._clientBus.new_atom<FollowerAtom>("Follower");
    follower_atom.atom_id = follower.atom_id;
    follower_atom.name = follower.name;
    if (follower.follows) {
      follower_atom.follows = follower.follows.map(publisher => {
        if (isAtom(publisher)) {
          return publisher as PublisherAtom;
        } else {
          return this.atomizePublisher(publisher);
        }
      });
    }
    return follower_atom;
  }

  atomizePublisher(publisher: Publisher): PublisherAtom {
    const publisher_atom = this._clientBus.new_atom<PublisherAtom>("Publisher");
    publisher_atom.atom_id = publisher.atom_id;
    publisher_atom.name = publisher.name;
    return publisher_atom;
  }

  atomizeMessage(message: Message): MessageAtom {
    const message_atom = this._clientBus.new_atom<MessageAtom>("Message");
    message_atom.atom_id = message.atom_id;
    let author: PublisherAtom;
    if (isAtom(message.author)) {
      author = message.author as PublisherAtom;
    } else {
      author = this.atomizePublisher(message.author);
    }
    message_atom.author = author;
    message_atom.content = message.content;
    return message_atom;
  }
}
