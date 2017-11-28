import { Widget, PrimitiveAtom, Field } from "client-bus";
import { GraphQlService } from "gql";

@Widget({
    fqelement: "PasskeyAuthentication", ng2_providers: [GraphQlService],
    template: ""
})

export class CreateRandomPasskeyComponent {
    @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

    constructor(private _graphQlService: GraphQlService) { }

    dvAfterInit() {
        this.submit_ok.on_change(() => {
            this._generatePasskey();
        });
    }

    _generatePasskey() {
        this._graphQlService
            .post(`
                createRandomPasskey(
                    dummyValue: true
                )
            `)
            .subscribe(
            _ => { console.log("something happen please"); }
            );
    }
}
