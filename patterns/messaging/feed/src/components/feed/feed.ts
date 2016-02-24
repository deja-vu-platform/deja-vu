import {Component, Input, OnInit} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";


import {Name} from "../../shared/data";
import {FeedService, FeedItem} from "../shared/feed";


@Component({
  selector: "feed",
  templateUrl: "./components/feed/feed.html",
  providers: [FeedService, HTTP_PROVIDERS]
})
export class FeedComponent implements OnInit {
  @Input() sub: Name;
  feed: FeedItem[];

  constructor(private _feedService: FeedService) {}

  ngOnInit() {
    this.feed = [];
    this._feedService.getFeed(this.sub).subscribe(
        feedItem => this.feed.push(feedItem));
  }
}
