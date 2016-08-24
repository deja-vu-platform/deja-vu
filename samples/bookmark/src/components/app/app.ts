import {RouteConfig, ROUTER_DIRECTIVES, Router} from "angular2/router";

import {HomeComponent} from "../home/home";
import {TopicsComponent} from "../topics/topics";
import {UsersComponent} from "../users/users";

import {Widget, WidgetLoader} from "client-bus";


@Widget({
  ng2_directives: [WidgetLoader, ROUTER_DIRECTIVES]
})
@RouteConfig([
  {path: "/home", name: "Home", component: HomeComponent, useAsDefault: true},
  {path: "/topics", name: "Topics", component: TopicsComponent},
  {path: "/users", name: "Users", component: UsersComponent}
])
export class AppComponent {
  constructor(private _router: Router) {}

  isRouteActive(route) {
    return this._router.isRouteActive(this._router.generate([route]));
  }
}
