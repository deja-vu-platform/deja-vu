import {provide} from "angular2/core";
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

bootstrap(
  SocialNetworkComponent, [
    provide("auth.api", {useValue: APIS.auth}),
    provide("friend.api", {useValue: APIS.friend}),
    provide("post.api", {useValue: APIS.post}),
    provide("feed.api", {useValue: APIS.feed}),
    ROUTER_PROVIDERS
  ]);
