import { Widget, PrimitiveAtom, Field} from "client-bus";
import { GraphQlService } from "gql";

@Widget({
    fqelement: "PasskeyAuthentication", ng2_providers: [GraphQlService]
})

export class CreateRandomPasskeyComponent {
    @Field("boolean") create_passkey_ok: PrimitiveAtom<boolean>;

    constructor(private _graphQlService: GraphQlService) { }

    generatePasskey() {
        this._graphQlService
            .post(`
                createRandomPasskey(
                    dummyValue: true
                )
            `)
            .subscribe(
                _ => { this.create_passkey_ok.value = true; }
            );
    }
}
