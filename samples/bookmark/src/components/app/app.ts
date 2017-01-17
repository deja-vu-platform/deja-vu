import {Widget, ClientBus, field} from "client-bus";

import {RouteConfig, ROUTER_DIRECTIVES, Router} from "angular2/router";

import {HomeComponent} from "../home/home";
import {TopicsComponent} from "../topics/topics";
import {UsersComponent} from "../users/users";


@Widget({fqelement: "dv-samples-bookmark"})
export class AppComponent {
  signout_ok = {value: false, on_change: undefined};

  constructor(private _router: Router, client_bus: ClientBus) {
    client_bus.init(this, [field("signout_ok", "Boolean")]);

    this.signout_ok.on_change(() => {
      if (this.signout_ok.value) {
        this._router.navigateByUrl("/landing");
      }
    });
  }

  isRouteActive(route) {
    return this._router.isRouteActive(this._router.generate([route]));
  }
}
