import {provide} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
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
    provide("friend.post", {useValue: APIS.post}),
    provide("friend.feed", {useValue: APIS.feed})
  ]);
