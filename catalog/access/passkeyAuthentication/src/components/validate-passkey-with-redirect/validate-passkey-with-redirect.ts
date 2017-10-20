import { NgClass } from "@angular/common";

import { UserAtom } from "../shared/data";
import { GraphQlService } from "gql";
import { Widget, ClientBus, Field,
        PrimitiveAtom, WidgetValue } from "client-bus";

@Widget({
    fqelement: "Authorization",
    ng2_providers: [GraphQlService],
    ng2_directives: [NgClass]
})
export class ValidatePasskeyWithRedirectComponent {
    @Field("User") user: UserAtom;
    @Field("Widget") on_validate_ok: PrimitiveAtom<WidgetValue>;
    error = false;

    constructor(
        private _graphQlService: GraphQlService,
        private _client_bus: ClientBus) { }

    onSubmit() {
        this._graphQlService
            .post(`
                validatePasskey(
                    passkey: "${this.user.passkey}"
                )
            `)
            .map(data => JSON.parse(data.validatePasskey))
            .subscribe(
                token => {
                    const authenticationToken = token.token;
                    const authenticatedUser = token.user;
                    localStorage.setItem("id_token", authenticationToken);
                    localStorage.setItem("username",
                                         authenticatedUser.username);
                    localStorage.setItem("atom_id", authenticatedUser.atom_id);
                    this._client_bus.navigate(this.on_validate_ok.value);
                },
                err => {
                    this.error = true;
                });
    }
}
