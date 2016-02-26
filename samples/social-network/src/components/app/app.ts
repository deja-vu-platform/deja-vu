import {Component} from "angular2/core";
import {RouteConfig, ROUTER_DIRECTIVES} from "angular2/router";

import {HomeComponent} from "../home/home";
import {FindFriendsComponent} from "../find-friends/find-friends";

@Component({
  selector: "app",
  templateUrl: "./components/app/app.html",
  directives: [HomeComponent, FindFriendsComponent, ROUTER_DIRECTIVES]
})
@RouteConfig([
  {path: "/", name: "Home", component: HomeComponent, useAsDefault: true},
  {path: "/find-friends", name: "FindFriends", component: FindFriendsComponent}
])
export class AppComponent {
}
