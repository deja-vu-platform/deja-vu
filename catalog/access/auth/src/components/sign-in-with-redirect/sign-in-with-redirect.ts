import {NgClass} from "@angular/common";

import {User} from "../../shared/data";
import {GraphQlService} from "gql";
import {Widget} from "client-bus";
import {Router} from "@angular/router";


@Widget({
   fqelement: "Auth",
   ng2_providers: [GraphQlService],
   ng2_directives: [NgClass]
})
export class SignInWithRedirectComponent {
  user: User = {username: "", password: ""};
  signin_ok_redirect_route = {value: "/"};
  error = false;

  constructor(
    private _graphQlService: GraphQlService, private _router: Router) {}

  onSubmit() {
    this._graphQlService
      .post(`
        signIn(
          username: "${this.user.username}", password: "${this.user.password}")
      `)
      .subscribe(
        token => {
          console.log("setting username " + this.user.username);
          localStorage.setItem("id_token", token);
          localStorage.setItem("username", this.user.username);
          this._router.navigate([this.signin_ok_redirect_route.value]);
        },
        err => {
          this.error = true;
        });
  }
}
