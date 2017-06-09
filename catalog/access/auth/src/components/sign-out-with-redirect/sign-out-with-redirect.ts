import {Widget, ClientBus} from "client-bus";


@Widget({
  fqelement: "Auth",
  template: `
    <button class="btn btn-default navbar-btn" (click)="signOut()">
      Sign Out
    </button>
  `
})
export class SignOutWithRedirectComponent {
  on_signout_ok = {value: undefined};

  constructor(private _client_bus: ClientBus) {}

  signOut() {
    localStorage.removeItem("id_token");
    localStorage.removeItem("username");
    localStorage.removeItem("atom_id");
    this._client_bus.navigate(this.on_signout_ok.value);
  }
}
