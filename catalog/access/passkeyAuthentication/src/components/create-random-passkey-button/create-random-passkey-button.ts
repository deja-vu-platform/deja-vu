import { Widget, PrimitiveAtom, Field} from "client-bus";
import { GraphQlService } from "gql";

@Widget({
    fqelement: "PasskeyAuthentication", ng2_providers: [GraphQlService]
})

export class CreateRandomPasskeyButtonComponent {
    @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

    constructor(private _graphQlService: GraphQlService) { }

    generatePasskey() {
        this._graphQlService
            .post(`
                createRandomPasskey(
                    dummyValue: true
                )
            `)
            .subscribe(
                _ => { this.submit_ok.value = true; }
            );
    }
}
