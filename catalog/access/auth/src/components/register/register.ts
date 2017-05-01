import {User} from "../../shared/data";
import {GraphQlService} from "gql";
import {Widget} from "client-bus";


@Widget({fqelement: "Auth", ng2_providers: [GraphQlService]})
export class RegisterComponent {
  user: User = {username: "", password: "", atom_id: ""};
  reenter_password = "";
  register_ok = {value: false};
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
