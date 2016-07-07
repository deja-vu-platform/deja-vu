import {Component, Output, EventEmitter} from "angular2/core";
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
  @Output() onSignIn = new EventEmitter();

  constructor(private _authService: AuthService) {}

  onSubmit() {
    this._authService.signIn(this.user).subscribe(
      token => {
        console.log("setting username " + this.user.username);
        localStorage.setItem("id_token", token);
        localStorage.setItem("username", this.user.username);
        this.onSignIn.emit(this.user);
      }
    );
  }
}
