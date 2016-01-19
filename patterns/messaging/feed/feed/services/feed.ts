import {Injectable} from "angular2/core";
import {Http, Headers} from "angular2/http";
import {Content, Publisher, Name} from "../data";
import {Observable} from "rxjs/Observable";


export interface FeedItem {
  content: Content;
  publisher: Publisher;
}

@Injectable()
export class FeedService {
  private _api = "http://localhost:3000/api";

  constructor(private _http: Http) {}

  getFeed(sub: Name): Observable<FeedItem> {
    return this._http.get(this._api + `/subs/${sub}/feed`)
      .map(res => res.json())
      .flatMap((pubs: Publisher[], unused_ix) => Observable.fromArray(pubs))
      .flatMap(
          (pub: Publisher, unused_ix: number) => {
            return Observable.fromArray(pub.published);
          },
          (pub: Publisher, content: Content, unused_pubi: number,
           unused_ci: number) => {
            return {content: content, publisher: pub};
          });
  }
}
