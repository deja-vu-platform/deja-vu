import {provide, PLATFORM_DIRECTIVES} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {FeedPatternComponent} from "./feed-pattern.component";
import {PublisherComponent} from "../components/publisher/publisher";
import {MessageComponent} from "../components/message/message";


const APIS = {feed: "http://localhost:3000"};


bootstrap(
  FeedPatternComponent, [
    provide("feed.api", {useValue: APIS.feed}),
    provide(
      PLATFORM_DIRECTIVES, {useValue: MessageComponent, multi: true}),
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherComponent, multi: true})
  ]);
