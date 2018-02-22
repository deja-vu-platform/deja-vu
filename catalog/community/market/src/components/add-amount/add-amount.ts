import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom} from "client-bus";
import {PartyAtom} from "../../shared/data";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class AddAmountComponent {
  @Field("Party") party: PartyAtom;
  @Field("number") amount: PrimitiveAtom<number>;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      this.onSubmit();
    });
  }

  onSubmit() {
    if (!this.party.atom_id) return;

    this._graphQlService
      .post(`
        AddAmount(
          amount: ${this.amount.value},
          party_id: "${this.party.atom_id}")
      `)
      .subscribe(_ => {
        this.amount.value = 0;
      });
  }
}
