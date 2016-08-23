import {Output, EventEmitter} from "@angular/core";
import {HTTP_PROVIDERS} from "@angular/http";

import {User} from "../../shared/data";
import {GraphQlService} from "gql";
import {Widget} from "client-bus";


@Widget({
  ng2_providers: [GraphQlService, HTTP_PROVIDERS]
})
export class RegisterComponent {
  user: User = {username: "", password: "", read: [], write: []};
  @Output() onRegister = new EventEmitter();

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    this._graphQlService
      .post(`
        register(
          username: "${this.user.username}", password: "${this.user.password}")
      `)
      .subscribe(res => {
        console.log("about to emit from register");
        this.onRegister.emit(this.user);
      });
  }
}
