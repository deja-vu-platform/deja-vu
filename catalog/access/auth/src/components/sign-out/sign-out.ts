import {Widget} from "client-bus";


@Widget({
  template: `
    <button class="btn btn-default navbar-btn" (click)="signOut()">
      Sign Out
    </button>
  `
})
export class SignOutComponent {
  signout_ok = {value: false};

  signOut() {
    localStorage.removeItem("id_token");
    localStorage.removeItem("username");
    this.signout_ok.value = true;
  }
}
