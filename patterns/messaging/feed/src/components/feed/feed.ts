import {Component, Input} from "angular2/core";
import {OnInit} from "angular2/core";

import {Name} from "../../data";
import {FeedService, FeedItem} from "../shared/feed";


@Component({
  selector: "feed",
  templateUrl: "./components/feed/feed.html",
  providers: [FeedService]
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
