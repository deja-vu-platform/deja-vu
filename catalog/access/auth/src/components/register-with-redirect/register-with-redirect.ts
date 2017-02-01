import {User} from "../../shared/data";
import {GraphQlService} from "gql";
import {Widget} from "client-bus";
import {Router} from "@angular/router";


@Widget({fqelement: "dv-access-auth", ng2_providers: [GraphQlService]})
export class RegisterWithRedirectComponent {
  user: User = {username: "", password: ""};
  reenter_password = "";
  username_error = false;
  route = {value: "/"};
  reenter_password_error = false;

  constructor(
    private _graphQlService: GraphQlService, private _router: Router) {}

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
            .subscribe(
              token => {
                localStorage.setItem("id_token", token);
                localStorage.setItem("username", this.user.username);
                this._router.navigate([this.route.value]);
              });
        },
        err => {
          this.username_error = true;
        });
  }
}
