import { PasskeyAtom } from "../shared/data";
import { GraphQlService } from "gql";
import { Widget, PrimitiveAtom, Field } from "client-bus";

@Widget({ fqelement: "PasskeyAuthentication", ng2_providers: [GraphQlService] })
export class CreateCustomPasskeyContentComponent {
    @Field("Passkey") passkey: PasskeyAtom;
    @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

    error = false;

    constructor(private _graphQlService: GraphQlService) { }

    dvAfterInit() {
        this.submit_ok.on_change(() => {
            this._createPasskey();
        });
    }

    _createPasskey() {
        this._graphQlService
            .post(`
                createCustomPasskey(
                    code: "${this.passkey.code}"
                )
            `)
            .subscribe(
                _ => { this.passkey.code = ""; },
                err => {
                    this.error = true;
                }
            );
    }
}
