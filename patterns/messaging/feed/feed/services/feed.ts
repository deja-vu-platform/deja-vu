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

  getFeed(sub: Name) {
    console.log("trying to do something");
    console.log(
        this._http.get(this._api + `/subs/${sub}/feed`)
      .map(res => {
        console.log(res);
        return res.json();
      })
        );
    return this._http.get(this._api + `/subs/${sub}/feed`)
      .map(res => {
        console.log("on map " + JSON.stringify(res));
        console.log("on map json" + JSON.stringify(res.json()));
        return res.json();
      })
      .flatMap(
          (pub: Publisher, unused_ix: number) => {
            console.log("here " + JSON.stringify(pub));
            console.log("here " + unused_ix);
            console.log("here " + JSON.stringify(pub.name));
            console.log("here " + JSON.stringify(pub.published));
            return Observable.fromArray(pub.published);
          },
          (pub: Publisher, content: Content, pubi: number, ci: number) => {
            console.log("content is " + content);
            return {content: content, publisher: pub};
          });
  }
}
