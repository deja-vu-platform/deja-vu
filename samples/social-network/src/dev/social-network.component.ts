import {Component} from "angular2/core";
import {RouteConfig, ROUTER_DIRECTIVES} from "angular2/router";

import {LandingComponent} from "../components/landing/landing";
import {AppComponent} from "../components/app/app";


@Component({
  selector: "social-network",
  template: `<router-outlet></router-outlet>`,
  directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([
  {path: "/landing", name: "Landing", component: LandingComponent,
   useAsDefault: true},
  {path: "/app/...", name: "App", component: AppComponent}
])
export class SocialNetworkComponent {
  public title = "Social Network";
}
