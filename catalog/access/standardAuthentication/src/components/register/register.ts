import {UserAtom} from "../shared/data";
import {GraphQlService} from "gql";
import {Widget, PrimitiveAtom, Field} from "client-bus";


@Widget({fqelement: "StandardAuthentication", ng2_providers: [GraphQlService]})
export class RegisterComponent {
  @Field("User") user: UserAtom;
  @Field("boolean") register_ok: PrimitiveAtom<boolean>;

  reenter_password = "";
  username_error = false;
  reenter_password_error = false;

  constructor(private _graphQlService: GraphQlService) {}

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
          this.register_ok.value = true;
        },
        err => {
          this.username_error = true;
        });
  }
}
