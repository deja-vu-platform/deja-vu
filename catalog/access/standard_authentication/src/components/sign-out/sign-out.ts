import {Widget, PrimitiveAtom, Field} from "client-bus";


@Widget({
  fqelement: "Auth",
  template: `
    <button class="btn btn-default navbar-btn" (click)="signOut()">
      Sign Out
    </button>
  `
})
export class SignOutComponent {
  @Field("boolean") signout_ok: PrimitiveAtom<boolean>;

  signOut() {
    localStorage.removeItem("id_token");
    localStorage.removeItem("username");
    localStorage.removeItem("atom_id");
    this.signout_ok.value = true;
  }
}
