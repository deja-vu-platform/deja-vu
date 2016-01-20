import {Component, Input} from "angular2/core";

import {User} from "../../data";
import {AuthService} from "../../services/auth";


@Component({
  selector: "register",
  templateUrl: "./auth/components/register/register.html",
  providers: [AuthService]
})
export class RegisterComponent {
  user: User = {username: "", password: "", read: [], write: []};

  constructor(private _authService: AuthService) {}

  onSubmit() {
    this._authService.register(this.user).subscribe();
  }
}
