import {Component, provide, PLATFORM_DIRECTIVES} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {FeedPatternComponent} from "./feed-pattern.component";


const APIS = {feed: "http://localhost:3000"};


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



bootstrap(
  FeedPatternComponent, [
    provide("feed.api", {useValue: APIS.feed}),
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherContentComponent, multi: true}),
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherNameComponent, multi: true})
  ]);
