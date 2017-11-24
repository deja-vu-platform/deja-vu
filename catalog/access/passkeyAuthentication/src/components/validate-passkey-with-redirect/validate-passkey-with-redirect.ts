import { NgClass } from "@angular/common";

import { PasskeyAtom } from "../shared/data";
import { GraphQlService } from "gql";
import { Widget, ClientBus, Field,
        PrimitiveAtom, WidgetValue } from "client-bus";

@Widget({
    fqelement: "Authorization",
    ng2_providers: [GraphQlService],
    ng2_directives: [NgClass]
})
export class ValidatePasskeyWithRedirectComponent {
    @Field("Passkey") passkey: PasskeyAtom;
    @Field("Widget") on_validate_ok: PrimitiveAtom<WidgetValue>;

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
                    localStorage.setItem("id_token", authenticationToken);
                    localStorage.setItem("atom_id",
                                         authenticatedPasskey.atom_id);
                    this._client_bus.navigate(this.on_validate_ok.value);
                },
                err => {
                    this.error = true;
                });
    }
}
