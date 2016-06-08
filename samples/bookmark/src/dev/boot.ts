import {provide, Component, PLATFORM_DIRECTIVES} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {ROUTER_PROVIDERS} from "angular2/router";

import {BookmarkComponent} from "../components/bookmark/bookmark";

import "rxjs/add/operator/map";

import {COMP_INFO} from "../shared/comp";


const LOCS = {
  bookmark_1: "@@dv-samples-bookmark-1",
  auth_1: "@@dv-access-auth-1",
  follow_1: "@@dv-community-follow-1",
  follow_2: "@@dv-community-follow-2",
  post_1: "@@dv-messaging-post-1",
  label_1: "@@dv-organization-label-1",
  feed_1: "@@dv-messaging-feed-1"
};

@Component({
  selector: "publisher-message",
  template: `{{msg.content}}`,
  inputs: ["msg"]
})
class PublisherMessageComponent {}

@Component({
  selector: "publisher",
  template: `{{pub.name}}`,
  inputs: ["pub"]
})
class PublisherComponent {}




bootstrap(
  BookmarkComponent, [
    provide("auth.api", {useValue: LOCS.auth_1}),
    provide("follow_1.api", {useValue: LOCS.follow_1}),
    provide("follow_2.api", {useValue: LOCS.follow_2}),
    provide("post.api", {useValue: LOCS.post_1}),
    provide("feed.api", {useValue: LOCS.feed_1}),
    provide("label.api", {useValue: LOCS.label_1}),
    ROUTER_PROVIDERS,
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherMessageComponent, multi: true}),
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherComponent, multi: true}),
    provide("element", {useValue: "bookmark"}),
    provide("loc", {useValue: LOCS.bookmark_1}),
    provide("CompInfo", {useValue: COMP_INFO})
  ]);
