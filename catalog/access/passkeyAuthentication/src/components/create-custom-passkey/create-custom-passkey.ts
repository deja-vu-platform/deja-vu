import { PasskeyAtom } from "../shared/data";
import { GraphQlService } from "gql";
import { Widget, PrimitiveAtom, Field } from "client-bus";

@Widget({ fqelement: "PasskeyAuthorization", ng2_providers: [GraphQlService] })
export class ValidatePasskeyComponent {
    @Field("Passkey") passkey: PasskeyAtom;
    @Field("boolean") create_passkey_ok: PrimitiveAtom<boolean>;

    error = false;

    constructor(private _graphQlService: GraphQlService) { }

    onSubmit() {
        this._graphQlService
            .post(`
                createCustomPasskey(
                    code: "${this.passkey.code}"
                )
            `)
            .subscribe(
                _ => { this.create_passkey_ok.value = true; },
                err => {
                    this.error = true;
                }
            );
    }
}
