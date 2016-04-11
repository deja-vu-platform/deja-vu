import {provide, Component, PLATFORM_DIRECTIVES} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {ROUTER_PROVIDERS} from "angular2/router";

import {BookmarkComponent} from "../components/bookmark/bookmark";

import "rxjs/add/operator/map";


const APIS = {
  auth: "@@dv-access-auth",
  follow: "@@dv-community-follow",
  post: "@@dv-messaging-post",
  feed: "@@dv-messaging-feed"
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
    provide("follow.api", {useValue: APIS.follow}),
    provide("post.api", {useValue: APIS.post}),
    provide("feed.api", {useValue: APIS.feed}),
    ROUTER_PROVIDERS,
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherContentComponent, multi: true}),
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherNameComponent, multi: true})
  ]);
