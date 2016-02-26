import {Component} from "angular2/core";
import {Router} from "angular2/router";

import {SignInComponent} from
"dv-access-auth/lib/components/sign-in/sign-in";
import {RegisterComponent} from
"dv-access-auth/lib/components/register/register";

@Component({
  selector: "home",
  templateUrl: "./components/home/home.html",
  directives: [SignInComponent, RegisterComponent]
})
export class HomeComponent {
  constructor(private _router: Router) {}

  onEnter(user) {
    console.log("on enter");
    console.log(JSON.stringify(user));
    this._router.navigate(["NewsFeed"]);
  }
}
