import {NgClass} from "@angular/common";

import {User} from "../../shared/data";
import {GraphQlService} from "gql";
import {Widget} from "client-bus";


@Widget({
   fqelement: "dv-access-auth",
   ng2_providers: [GraphQlService],
   ng2_directives: [NgClass]
})
export class SignInComponent {
  user: User = {username: "", password: ""};
  signin_ok = {value: false};
  error = false;

  constructor(private _graphQlService: GraphQlService) {}

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
          this.signin_ok.value = true;
        },
        err => {
          this.error = true;
        });
  }
}
