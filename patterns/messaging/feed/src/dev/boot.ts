import {provide} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {FeedPatternComponent} from "./feed-pattern.component";


const APIS = {feed: "http://localhost:3000"};


bootstrap(
  FeedPatternComponent, [
    provide("feed.api", {useValue: APIS.feed})
  ]);
