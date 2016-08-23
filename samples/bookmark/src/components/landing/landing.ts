import {Component} from "angular2/core";
import {Router, ROUTER_DIRECTIVES} from "angular2/router";

import {Widget} from "client-bus";

import {SignInComponent} from
"dv-access-auth/lib/components/sign-in/sign-in";
import {RegisterComponent} from
"dv-access-auth/lib/components/register/register";


// @Component({
//   selector: "landing",
//   templateUrl: "./components/landing/landing.html",
//   directives: [
//       getDirective(SignInComponent, "dv-access-auth"),
//       getDirective(RegisterComponent, "dv-access-auth"),
//       ROUTER_DIRECTIVES]
// })
@Widget({
  widgets: [
      SignInComponent("dv-access-auth"),
      RegisterComponent("dv-access-auth")
  ],
  ng2_directives: [ROUTER_DIRECTIVES]
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
