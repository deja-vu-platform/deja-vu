import {GraphQlService} from "gql";
import {Widget, ClientBus, Field} from "client-bus";
import {MarketAtom, PartyAtom, GoodAtom} from "../../shared/data";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class ShowAffordableGoodsComponent {
  @Field("Party") buyer: PartyAtom;
  @Field("Market") market: MarketAtom;
  affordableGoods = [];

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (!this.buyer.atom_id || !this.market.atom_id) {
      return;
    }
    this.affordableGoods = [];
    this._graphQlService
      .get(`
        AffordableGoods(
          market_id: "${this.market.atom_id},
          buyer_id: "${this.buyer.atom_id}"
        ) {
          atom_id,
          name,
          price,
          seller {
            atom_id
          },
          quantity
        }
      `)
      .map(data => data.AffordableGoods)
      .flatMap((goods, unused_ix) => Observable.from(goods))
      .map((good: GoodAtom) => {
        const good_atom = this._clientBus.new_atom<GoodAtom>("Good");
        const seller_atom = this._clientBus.new_atom<PartyAtom>("Party");
        good_atom.atom_id = good.atom_id;
        good_atom.name = good.name;
        good_atom.price = good.price;
        good_atom.quantity = good.quantity;
        seller_atom.atom_id = good.seller.atom_id;
        good_atom.seller = seller_atom;
        return good_atom;
      })
      .subscribe(good => {
        this.affordableGoods.push(good);
      });
  }
}
