import {Component, Input} from "angular2/core";
import {OnInit} from "angular2/core";

import {Name} from "../../data";
import {FeedService, FeedItem} from "../../services/feed";


@Component({
  selector: "feed",
  templateUrl: "./feed/components/feed/feed.html",
  providers: [FeedService]
})
export class FeedComponent implements OnInit {
  @Input() name: Name;
  feed: FeedItem[];

  constructor(private _feedService: FeedService) {}

  ngOnInit() {
    console.log("got as input " + this.name);
    this._feedService.getFeed(this.name).subscribe(feed => this.feed = feed);
  }
}
