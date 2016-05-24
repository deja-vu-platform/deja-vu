import {provide, Component, PLATFORM_DIRECTIVES} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {ROUTER_PROVIDERS} from "angular2/router";

import {BookmarkComponent} from "../components/bookmark/bookmark";

import "rxjs/add/operator/map";

import {Composer} from "composer";
import {TBONDS, FBONDS} from "../shared/data";


const loc = "http://localhost:3000";

const COMP_INFO = {
  tbonds: TBONDS,
  fbonds: FBONDS
};

const APIS = {
  auth: "@@dv-access-auth-1",
  follow_1: "@@dv-community-follow-1",
  follow_2: "@@dv-community-follow-2",
  post: "@@dv-messaging-post-1",
  label: "@@dv-organization-label-1",
  feed: "@@dv-messaging-feed-1"
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
    provide("auth.api", {useValue: APIS.auth}),
    provide("follow_1.api", {useValue: APIS.follow_1}),
    provide("follow_2.api", {useValue: APIS.follow_2}),
    provide("post.api", {useValue: APIS.post}),
    provide("feed.api", {useValue: APIS.feed}),
    provide("label.api", {useValue: APIS.label}),
    ROUTER_PROVIDERS,
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherMessageComponent, multi: true}),
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherComponent, multi: true}),
    provide(Composer, {useValue: new Composer("bookmark", loc, COMP_INFO)})
  ]);
