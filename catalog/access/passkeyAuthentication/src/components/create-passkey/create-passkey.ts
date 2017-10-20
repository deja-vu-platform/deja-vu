import { UserAtom } from "../shared/data";
import { GraphQlService } from "gql";
import { Widget, PrimitiveAtom, Field } from "client-bus";

@Widget({ fqelement: "PasskeyAuthorization", ng2_providers: [GraphQlService] })
export class ValidatePasskeyComponent {
    @Field("User") user: UserAtom;
    @Field("boolean") create_passkey_ok: PrimitiveAtom<boolean>;

    error = false;

    constructor(private _graphQlService: GraphQlService) { }

    onSubmit() {
        this._graphQlService
            .post(`
                createPasskey(
                    username: "${this.user.username}",
                    passkey: "${this.user.passkey}"
                )
            `)
            .subscribe(
                _ => { this.create_passkey_ok = true; },
                err => {
                    this.error = true;
                }
            );
    }
}
