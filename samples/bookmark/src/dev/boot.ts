import {provide, Component, PLATFORM_DIRECTIVES} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {ROUTER_PROVIDERS} from "angular2/router";

import {BookmarkComponent} from "../components/bookmark/bookmark";

import "rxjs/add/operator/map";


const APIS = {
  auth: "@@dv-access-auth-1",
  follow_1: "@@dv-community-follow-1",
  follow_2: "@@dv-community-follow-2",
  post: "@@dv-messaging-post-1",
  feed: "@@dv-messaging-feed-1"
};

@Component({
  selector: "publisher-content",
  template: `{{item.content}}`,
  inputs: ["item"]
})
class PublisherContentComponent {}

@Component({
  selector: "publisher-name",
  template: `{{item}}`,
  inputs: ["item"]
})
class PublisherNameComponent {}


bootstrap(
  BookmarkComponent, [
    provide("auth.api", {useValue: APIS.auth}),
    provide("follow_1.api", {useValue: APIS.follow_1}),
    provide("follow_2.api", {useValue: APIS.follow_2}),
    provide("post.api", {useValue: APIS.post}),
    provide("feed.api", {useValue: APIS.feed}),
    ROUTER_PROVIDERS,
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherContentComponent, multi: true}),
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherNameComponent, multi: true})
  ]);
