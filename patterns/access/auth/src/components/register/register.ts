import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {User} from "../../shared/data";
import {AuthService} from "../shared/auth";


@Component({
  selector: "register",
  templateUrl: "./components/register/register.html",
  providers: [AuthService, HTTP_PROVIDERS]
})
export class RegisterComponent {
  user: User = {username: "", password: "", read: [], write: []};

  constructor(private _authService: AuthService) {}

  onSubmit() {
    this._authService.register(this.user).subscribe();
  }
}
