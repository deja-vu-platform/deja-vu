import { Widget, ClientBus, PrimitiveAtom,
        Field, WidgetValue } from "client-bus";

@Widget({
    fqelement: "PasskeyAuthentication",
    template: `
      <button class="btn btn-default navbar-btn" (click)="signOut()">
        Sign Out
      </button>
    `
})

export class SignOutWithRedirectComponent {
    @Field("Widget") on_signout_ok: PrimitiveAtom<WidgetValue>;

    constructor(private _client_bus: ClientBus) { }

    signOut() {
        localStorage.removeItem("id_token");
        localStorage.removeItem("atom_id");
        this._client_bus.navigate(this.on_signout_ok.value);
    }
}
