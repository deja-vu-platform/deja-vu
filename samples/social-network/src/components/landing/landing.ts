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

  onEnter(user) {
    console.log("on enter");
    console.log(JSON.stringify(user));
    this._router.navigate(["App"]);
  }
}
