import {Output, EventEmitter} from "@angular/core";
import {HTTP_PROVIDERS} from "@angular/http";

import {User} from "../../shared/data";
import {GraphQlService} from "gql";
import {Widget} from "client-bus";


@Widget({
   ng2_providers: [GraphQlService, HTTP_PROVIDERS]
})
export class SignInComponent {
  user: User = {username: "", password: "", read: [], write: []};
  @Output() onSignIn = new EventEmitter();

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    this._graphQlService
      .post(`
        signIn(
          username: "${this.user.username}", password: "${this.user.password}")
      `)
      .subscribe(token => {
        console.log("setting username " + this.user.username);
        localStorage.setItem("id_token", token);
        localStorage.setItem("username", this.user.username);
        this.onSignIn.emit(this.user);
      });
  }
}
