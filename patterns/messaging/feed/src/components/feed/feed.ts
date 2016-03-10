import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";


import {Name} from "../../shared/data";
import {FeedService, FeedItem} from "../shared/feed";


@Component({
  selector: "publisher-content",
  template: "{{item}}",
  inputs: ["item"]
})
class PublisherContentComponent {}

@Component({
  selector: "publisher-name",
  template: "{{item}}",
  inputs: ["item"]
})
class PublisherNameComponent {}


let publisherComponentProvider = field => {
  if (field === "name") {
    return PublisherNameComponent;
  } else if (field === "content") {
    return PublisherContentComponent;
  }
};


@Component({
  selector: "feed",
  templateUrl: "./components/feed/feed.html",
  providers: [FeedService, HTTP_PROVIDERS],
  directives: [
    publisherComponentProvider("name"), publisherComponentProvider("content")
  ],
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
