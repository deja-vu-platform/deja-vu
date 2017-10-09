import {NgClass} from "@angular/common";

import {UserAtom} from "../shared/data";
import {GraphQlService} from "gql";
import {Widget, PrimitiveAtom, Field} from "client-bus";


@Widget({
   fqelement: "Auth",
   ng2_providers: [GraphQlService],
   ng2_directives: [NgClass]
})
export class ChangePasswordComponent {
  @Field("User") user: UserAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  new_password = "";
  confirm_new_password = "";
  old_password_error = false;
  confirm_new_password_error = false;

  constructor(private _graphQlService: GraphQlService) {}
  
  onSubmit() {
    this.clearErrors();
    this.confirm_new_password_error =
      this.new_password !== this.confirm_new_password;
    if (this.confirm_new_password_error) return;

    this._graphQlService
      .post(`
        changePassword(
          username: "${this.user.username}",
          oldPassword: "${this.user.password}",
          newPassword: "${this.new_password}"
        )
      `)
      .subscribe(
        _ => {
          // clear the form
          this.user.password = "";
          this.confirm_new_password = "";
          this.new_password = "";
          // trigger success message
          this.submit_ok.value = true;
        },
        err => {
          this.old_password_error = true;
        });
  }

  clearErrors() {
    this.old_password_error = false;
    this.confirm_new_password_error = false;
  }
}
