import { NgClass } from "@angular/common";

import { PasskeyAtom } from "../shared/data";
import { GraphQlService } from "gql";
import {
    Widget, ClientBus, Field,
    PrimitiveAtom, WidgetValue
} from "client-bus";

@Widget({
    fqelement: "PasskeyAuthentication",
    ng2_providers: [GraphQlService],
    ng2_directives: [NgClass]
})
export class ValidateGuestPasskeyWithRedirectComponent {
    @Field("Passkey") passkey: PasskeyAtom;
    @Field("Widget") on_guest_validate_ok: PrimitiveAtom<WidgetValue>;

    error = false;

    constructor(
        private _graphQlService: GraphQlService,
        private _client_bus: ClientBus) { }

    onSubmit() {
        this._graphQlService
            .post(`
                validatePasskey(
                    code: "${this.passkey.code}"
                )
            `)
            .map(data => JSON.parse(data.validatePasskey))
            .subscribe(
                token => {
                    const authenticationToken = token.token;
                    const authenticatedPasskey = token.passkey;
                    localStorage.setItem("guest_id_token", authenticationToken);
                    localStorage.setItem("guest_atom_id",
                        authenticatedPasskey.atom_id);
                    this._client_bus.navigate(this.on_guest_validate_ok.value);
                },
                err => {
                    this.error = true;
                });
    }
}
