import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom} from "client-bus";
import {PartyAtom, GoodAtom} from "../../shared/data";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService],
  template: ``
})
export class EditGoodSellerComponent {
  @Field("Good") good: GoodAtom;
  @Field("Party") seller: PartyAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.good.atom_id) {
      this.fetch();
    }

    this.submit_ok.on_change(() => {
      if (this.seller.atom_id) {
        this._graphQlService
        .get(`
          good_by_id(atom_id: "${this.good.atom_id}") {
            updateGood(
              seller_id: "${this.seller.atom_id}"
            )
          }
        `)
        .subscribe(_ => undefined);
      }
    });
  }

  private fetch() {
    this._graphQlService
      .get(`
        good_by_id(atom_id: "${this.good.atom_id}") {
          seller{atom_id}
        }
      `)
    .map(data => data.good_by_id)
    .subscribe(good => {
      if (good.seller)
        this.seller.atom_id = good.seller.atom_id;
    });
  }
}
