import { Widget, ClientBus, PrimitiveAtom,
         Field, WidgetValue } from "client-bus";

@Widget({
    fqelement: "StandardAuthentication",
    template: `
    <button class="btn btn-default navbar-btn" (click)="signOut()">
      Sign Out
    </button>
  `
})
export class GuestSignOutWithRedirectComponent {
    @Field("Widget") on_guest_signout_ok: PrimitiveAtom<WidgetValue>;

    constructor(private _client_bus: ClientBus) { }

    signOut() {
        localStorage.removeItem("guest_id_token");
        localStorage.removeItem("guest_username");
        localStorage.removeItem("guest_atom_id");
        if (this.on_guest_signout_ok.value)
            this._client_bus.navigate(this.on_guest_signout_ok.value);
    }
}
