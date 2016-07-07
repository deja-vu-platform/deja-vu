import {Component, provide, PLATFORM_DIRECTIVES} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {FeedPatternComponent} from "./feed-pattern.component";


const APIS = {feed: "http://localhost:3000"};


@Component({
  selector: "publisher-message",
  template: "{{msg}}",
  inputs: ["msg"]
})
class PublisherMessageComponent {}

@Component({
  selector: "publisher",
  template: "{{pub}}",
  inputs: ["pub"]
})
class PublisherComponent {}



bootstrap(
  FeedPatternComponent, [
    provide("feed.api", {useValue: APIS.feed}),
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherMessageComponent, multi: true}),
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherComponent, multi: true})
  ]);
