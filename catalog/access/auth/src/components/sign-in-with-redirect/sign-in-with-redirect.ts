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
  user: User = {username: "", password: "", atom_id: ""};
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
      .map(data => JSON.parse(data.signIn))
      .subscribe(
        token => {
          let authToken = token.token,
            authUser = token.user;
          console.log("setting username " + this.user.username);
          localStorage.setItem("id_token", authToken);
          localStorage.setItem("username", this.user.username);
          localStorage.setItem("atom_id", authUser.atom_id);
          this._router.navigate([this.signin_ok_redirect_route.value]);
        },
        err => {
          this.error = true;
        });
  }
}
