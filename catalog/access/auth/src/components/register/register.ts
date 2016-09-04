import {HTTP_PROVIDERS} from "angular2/http";

import {User} from "../../shared/data";
import {GraphQlService} from "gql";
import {Widget} from "client-bus";


@Widget({
  ng2_providers: [GraphQlService, HTTP_PROVIDERS]
})
export class RegisterComponent {
  user: User = {username: "", password: ""};
  register_ok = {value: false};

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    this._graphQlService
      .post(`
        register(
          username: "${this.user.username}", password: "${this.user.password}")
      `)
      .subscribe(res => {
        console.log("about to emit from register");
        this.register_ok.value = true;
      });
  }
}
