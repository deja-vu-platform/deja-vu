import {Component} from "angular2/core";
import {RouteConfig, ROUTER_DIRECTIVES} from "angular2/router";

import {HomeComponent} from "../components/home/home";
import {NewsFeedComponent} from "../components/news-feed/news-feed";


@Component({
  selector: "social-network",
  template: `<router-outlet></router-outlet>`,
  directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([
  {path: "/", name: "Home", component: HomeComponent, useAsDefault: true},
  {path: "/news-feed", name: "NewsFeed", component: NewsFeedComponent}
])
export class SocialNetworkComponent {
  public title = "Social Network";
}
