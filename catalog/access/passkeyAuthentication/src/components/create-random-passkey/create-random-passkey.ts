import { Widget, PrimitiveAtom, Field} from "client-bus";
import { GraphQlService } from "gql";

@Widget({
    fqelement: "PasskeyAuthentication",
    template: `
  <button class="btn btn-default navbar-btn" (click)="generatePasskey()">
    Generate Passkey
  </button>
`
})
export class CreateRandomPasskeyComponent {
    @Field("boolean") create_passkey_ok: PrimitiveAtom<boolean>;

    constructor(private _graphQlService: GraphQlService) { }

    generatePasskey() {
        this._graphQlService
            .post(`
                createRandomPasskey()
            `)
            .subscribe(
                _ => { this.create_passkey_ok.value = true; }
            );
    }
}
