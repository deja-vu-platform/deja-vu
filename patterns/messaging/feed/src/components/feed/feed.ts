import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";


import {Name} from "../../shared/data";
import {FeedService, FeedItem} from "../shared/feed";


@Component({
  selector: "feed",
  templateUrl: "./components/feed/feed.html",
  styleUrls: ["./components/feed/feed.css"],
  providers: [FeedService, HTTP_PROVIDERS],
  inputs: ["sub"]
})
export class FeedComponent {
  feed: FeedItem[];
  private _sub: Name;

  constructor(private _feedService: FeedService) {}

  // this works but it's kind of ugly
  get sub() {
    return this._sub;
  }

  set sub(sub: Name) {
    if (!sub) return;
    console.log("got new sub" + sub);
    this._sub = sub;


    this.feed = [];
    this._feedService.getFeed(this._sub).subscribe(
        feedItem => this.feed.push(feedItem));
  }
}
