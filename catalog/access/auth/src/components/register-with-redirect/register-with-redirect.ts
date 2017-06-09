import {User} from "../../shared/data";
import {GraphQlService} from "gql";
import {Widget, ClientBus} from "client-bus";


@Widget({fqelement: "Auth", ng2_providers: [GraphQlService]})
export class RegisterWithRedirectComponent {
  user: User = {username: "", password: "", atom_id: ""};
  reenter_password = "";
  username_error = false;
  on_register_ok = {value: undefined};
  reenter_password_error = false;

  constructor(
    private _graphQlService: GraphQlService,
    private _client_bus: ClientBus) {}

  onSubmit() {
    this.reenter_password_error = this.reenter_password !== this.user.password;
    if (this.reenter_password_error) return;

    this._graphQlService
      .post(`
        register(
          username: "${this.user.username}", password: "${this.user.password}")
      `)
      .subscribe(
        _ => {
          return this._graphQlService
            .post(`
              signIn(
                username: "${this.user.username}",
                password: "${this.user.password}")
            `)
            .map(data => JSON.parse(data.signIn))
            .subscribe(
              token => {
                let authToken = token.token;
                let authUser = token.user;
                localStorage.setItem("id_token", authToken);
                localStorage.setItem("username", this.user.username);
                localStorage.setItem("atom_id", authUser.atom_id);
                this._client_bus.navigate(this.on_register_ok.value);
              });
        },
        err => {
          this.username_error = true;
        });
  }
}
