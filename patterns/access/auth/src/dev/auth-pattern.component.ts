import {Component} from "angular2/core";
import {SignInComponent} from "../components/sign-in/sign-in";
import {RegisterComponent} from "../components/register/register";

@Component({
  selector: "auth-pattern",
  template: `
    <h1>SignIn</h1>
    <sign-in>Loading...</sign-in>
    <h1>Register</h1>
    <register>Loading...</register>
  `,
  directives: [SignInComponent, RegisterComponent]
})
export class AuthPatternComponent {
  public title = "Auth Pattern";
}
