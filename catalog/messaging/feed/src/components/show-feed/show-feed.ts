import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {
  Message, Publisher, Subscriber, SubscriberAtom, MessageAtom,
  PublisherAtom
} from "../shared/data";
import {GraphQlService} from "gql";

import {Widget, ClientBus, Field, AfterInit} from "client-bus";


export interface FeedItem {
  message: Message;
  publisher: Publisher;
  subscriber: Subscriber;
}


@Widget({fqelement: "Feed", ng2_providers: [GraphQlService]})
export class ShowFeedComponent implements AfterInit {
  @Field("Subscriber") subscriber: SubscriberAtom;
  feed: FeedItem[];

  constructor(
      private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const update_feed = () => {
      if (!this.subscriber.name) return;

      this.feed = [];
      this._graphQlService
        .get(`
          subscriber(name: "${this.subscriber.name}") {
            subscriptions {
              name,
              messages {
                atom_id,
                content
              }
            }
          }
        `)
        .map(data => data.subscriber.subscriptions)
        .flatMap((pubs: Publisher[], unused_ix) => Observable.from(pubs))
        .flatMap(
            (pub: Publisher, unused_ix: number) => {
              return Observable.from(pub.messages);
            },
            (pub: Publisher, message: Message, unused_pubi: number,
             unused_ci: number) => {
              return {message: message, publisher: pub};
            })
        .map(feedItem => {
          const message = this._clientBus.new_atom<MessageAtom>("Message");
          message.content = feedItem.message.content;
          message.atom_id = feedItem.message.atom_id;
          const publisher = this._clientBus
            .new_atom<PublisherAtom>("Publisher");
          publisher.name = feedItem.publisher.name;
          return {
            message: message,
            publisher: publisher,
            subscriber: this.subscriber
          };
        })
        .subscribe(feedItem => {
          this.feed.push(feedItem);
        });
    };

    update_feed();
    this.subscriber.on_change(update_feed);
  }
}
