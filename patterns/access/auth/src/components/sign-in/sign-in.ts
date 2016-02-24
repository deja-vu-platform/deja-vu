import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {User} from "../../shared/data";
import {AuthService} from "../shared/auth";


@Component({
  selector: "sign-in",
  templateUrl: "./components/sign-in/sign-in.html",
  providers: [AuthService, HTTP_PROVIDERS]
})
export class SignInComponent {
  user: User = {username: "", password: "", read: [], write: []};

  constructor(private _authService: AuthService) {}

  onSubmit() {
    this._authService.signIn(this.user).subscribe();
  }
}
