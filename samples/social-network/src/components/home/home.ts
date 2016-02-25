import {Component} from "angular2/core";

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
}
