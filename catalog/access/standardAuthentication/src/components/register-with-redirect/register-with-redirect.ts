import {GraphQlService} from "gql";
import {Widget, ClientBus, Field, PrimitiveAtom, WidgetValue} from "client-bus";
import {UserAtom} from "../shared/data";

@Widget({fqelement: "StandardAuthentication", ng2_providers: [GraphQlService]})
export class RegisterWithRedirectComponent {
  @Field("User") user: UserAtom;
  @Field("Widget") on_register_ok: PrimitiveAtom<WidgetValue>;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  reenter_password = "";
  username_error = false;
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
      .map(data => data.register)
      .subscribe(
        atom_id => {
          this.user.atom_id = atom_id;
          this.submit_ok.value = true;
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
                if (this.on_register_ok.value)
                  this._client_bus.navigate(this.on_register_ok.value);
              });
        }
        ,err => {
          this.username_error = true;
        }
    );
  }
}
