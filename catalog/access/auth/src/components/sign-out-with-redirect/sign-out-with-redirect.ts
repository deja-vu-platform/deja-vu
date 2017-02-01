import {Widget} from "client-bus";
import {Router} from "@angular/router";


@Widget({
  fqelement: "dv-access-auth",
  template: `
    <button class="btn btn-default navbar-btn" (click)="signOut()">
      Sign Out
    </button>
  `
})
export class SignOutWithRedirectComponent {
  route = {value: "/"};

  constructor(private _router: Router) {}

  signOut() {
    localStorage.removeItem("id_token");
    localStorage.removeItem("username");
    this._router.navigate([this.route.value]);
  }
}
