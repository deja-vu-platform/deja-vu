import {Component, Output, EventEmitter} from "angular2/core";
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
  @Output() onRegister = new EventEmitter();

  constructor(private _authService: AuthService) {}

  onSubmit() {
    this._authService.register(this.user).subscribe(
      res => {
        console.log("about to emit from register");
        this.onRegister.emit(this.user);
      }
    );
  }
}
