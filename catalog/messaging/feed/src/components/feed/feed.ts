import {HTTP_PROVIDERS} from "angular2/http";

import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/map";
import "rxjs/add/observable/fromArray";
import "rxjs/add/operator/mergeMap";


import {Name, Message, Publisher} from "../../shared/data";
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
  private _sub: Name;

  constructor(private _graphQlService: GraphQlService) {}

  // this works but it's kind of ugly
  get sub() {
    return this._sub;
  }

  set sub(sub: Name) {
    if (!sub) return;
    console.log("got new sub" + sub);
    this._sub = sub;

    this.feed = [];
    this._graphQlService
      .get(`
        sub(name: "${this._sub}") {
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
  }
}
