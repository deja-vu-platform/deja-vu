import { NgClass } from "@angular/common";
import { Widget, Field, PrimitiveAtom, AfterInit } from "client-bus";
import { GraphQlService } from "gql";
import { PasskeyAtom } from "../shared/data";

@Widget({
    fqelement: "PasskeyAuthentication",
    ng2_providers: [GraphQlService],
    ng2_directives: [NgClass]
})
export class ValidatePasskeyContentComponent implements AfterInit {
    @Field("Passkey") passkey: PasskeyAtom;
    @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

    error = false;

    constructor(private _graphQlService: GraphQlService) { }

    dvAfterInit() {
        this.submit_ok.on_change(() => {
            this._validatePasskey();
        });
    }

    _validatePasskey() {
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
            },
            err => {
                this.error = true;
            });
    }
}
