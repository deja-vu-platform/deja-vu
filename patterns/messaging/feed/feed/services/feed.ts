import {Injectable} from "angular2/core";
import {Http, Headers} from "angular2/http";
import {Content, Publisher, Name} from "../data";

export interface FeedItem {
  content: Content;
  publisher: Publisher;
}

@Injectable()
export class FeedService {
  private _api = "http://localhost:3000/api";

  constructor(private _http: Http) {}

  getFeed(sub: Name) {
    return this._http.get(this._api + `/subs/${name}/feed`)
      .map(res => res.json());
      // stuff here
  }
}
