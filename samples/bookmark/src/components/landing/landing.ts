import {Component} from "angular2/core";
import {Router, ROUTER_DIRECTIVES} from "angular2/router";

import {SignInComponent} from
"dv-access-auth/lib/components/sign-in/sign-in";
import {RegisterComponent} from
"dv-access-auth/lib/components/register/register";

@Component({
  selector: "landing",
  templateUrl: "./components/landing/landing.html",
  directives: [SignInComponent, RegisterComponent, ROUTER_DIRECTIVES]
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
