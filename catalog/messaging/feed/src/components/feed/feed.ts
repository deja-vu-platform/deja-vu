import {HTTP_PROVIDERS} from "angular2/http";

import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/map";
import "rxjs/add/observable/fromArray";
import "rxjs/add/operator/mergeMap";


import {Message, Publisher} from "../../shared/data";
import {GraphQlService} from "gql";


import {Widget} from "client-bus";


export interface FeedItem {
  message: Message;
  publisher: Publisher;
}


@Widget({
  ng2_providers: [GraphQlService, HTTP_PROVIDERS]
})
export class FeedComponent {
  feed: FeedItem[];
  sub = {name: "", on_change: undefined};

  constructor(private _graphQlService: GraphQlService) {}

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
              published {
                content
              }
            }
          }
        `)
        .map(data => data.sub.subscriptions)
        .flatMap((pubs: Publisher[], unused_ix) => Observable.fromArray(pubs))
        .flatMap(
            (pub: Publisher, unused_ix: number) => {
              return Observable.fromArray(pub.published);
            },
            (pub: Publisher, message: Message, unused_pubi: number,
             unused_ci: number) => {
              return {message: message, publisher: pub};
            })
        .subscribe(feedItem => this.feed.push(feedItem));
    };

    update_feed();
    this.sub.on_change(update_feed);
  }
}
