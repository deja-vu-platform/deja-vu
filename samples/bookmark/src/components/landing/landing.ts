import {Widget, WidgetLoader} from "client-bus";
import {Router, ROUTER_DIRECTIVES} from "angular2/router";


@Widget({
  ng2_directives: [WidgetLoader, ROUTER_DIRECTIVES]
})
export class LandingComponent {
  constructor(private _router: Router) {}

  onRegister(user) {
    console.log("user registered");
  }

  onSignIn(user) {
    console.log("sign in of " + JSON.stringify(user) + " succ");
    this._router.navigateByUrl("/app");
  }
}
