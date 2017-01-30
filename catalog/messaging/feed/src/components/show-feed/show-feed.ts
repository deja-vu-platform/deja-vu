import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";


import {Message, Publisher} from "../../shared/data";
import {GraphQlService} from "gql";


import {Widget, ClientBus} from "client-bus";

import * as _u from "underscore";


export interface FeedItem {
  message: Message;
  publisher: Publisher;
}


@Widget({
  fqelement: "dv-messaging-feed",
  ng2_providers: [GraphQlService]
})
export class ShowFeedComponent {
  feed: FeedItem[];
  sub = {name: "", on_change: undefined};
  fields = {};
  feed_item_widget = {name: "FeedItem"};

  constructor(
      private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const update_feed = () => {
      if (!this.sub.name) return;
      console.log("got new sub" + this.sub.name);

      this.feed = [];
      this._graphQlService
        .get(`
          sub(name: "${this.sub.name}") {
            subscriptions {
              name,
              messages {
                atom_id,
                content
              }
            }
          }
        `)
        .map(data => data.sub.subscriptions)
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
          const message = this._clientBus.new_atom("Message");
          message.content = feedItem.message.content;
          message.atom_id = feedItem.message.atom_id;
          const publisher = this._clientBus.new_atom("Publisher");
          publisher.name = feedItem.publisher.name;
          return {message: message, publisher: publisher};
        })
        .map(feedItem => _u.extend(feedItem, this.fields))
        .subscribe(feedItem => {
          this.feed.push(feedItem);
        });
    };

    update_feed();
    this.sub.on_change(update_feed);
  }
}
