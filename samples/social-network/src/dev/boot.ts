import {provide, Component, PLATFORM_DIRECTIVES} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {ROUTER_PROVIDERS} from "angular2/router";

import {SocialNetworkComponent} from "./social-network.component";

import "rxjs/add/operator/map";


const APIS = {
  auth: "@@dv-access-auth",
  friend: "@@dv-community-friend",
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
  SocialNetworkComponent, [
    provide("auth.api", {useValue: APIS.auth}),
    provide("friend.api", {useValue: APIS.friend}),
    provide("post.api", {useValue: APIS.post}),
    provide("feed.api", {useValue: APIS.feed}),
    ROUTER_PROVIDERS,
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherContentComponent, multi: true}),
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherNameComponent, multi: true})
  ]);
