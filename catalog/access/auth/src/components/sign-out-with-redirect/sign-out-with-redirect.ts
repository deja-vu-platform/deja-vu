import {Widget} from "client-bus";
import {Router} from "@angular/router";


@Widget({
  fqelement: "Auth",
  template: `
    <button class="btn btn-default navbar-btn" (click)="signOut()">
      Sign Out
    </button>
  `
})
export class SignOutWithRedirectComponent {
  signout_ok_redirect_route = {value: "/"};

  constructor(private _router: Router) {}

  signOut() {
    localStorage.removeItem("id_token");
    localStorage.removeItem("username");
    localStorage.removeItem("atom_id");
    this._router.navigate([this.signout_ok_redirect_route.value]);
  }
}
