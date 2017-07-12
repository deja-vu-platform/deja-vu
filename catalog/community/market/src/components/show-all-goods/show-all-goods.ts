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
export class ShowAllGoodsComponent {
  @Field("Market") market: MarketAtom;
  allGoods = [];

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (!this.market.atom_id) {
      return;
    }
    this.allGoods = [];
    this._graphQlService
      .get(`
        GoodsByMarket(
          market_id: "${this.market.atom_id}"
        ) {
          atom_id,
          name,
          price,
          seller {
            atom_id
          },
          supply
        }
      `)
      .map(data => data.GoodsByMarket)
      .flatMap((goods, unused_ix) => Observable.from(goods))
      .map((good: GoodAtom) => {
        const good_atom = this._clientBus.new_atom<GoodAtom>("Good");
        const seller_atom = this._clientBus.new_atom<PartyAtom>("Party");
        good_atom.atom_id = good.atom_id;
        good_atom.name = good.name;
        good_atom.price = good.price;
        good_atom.supply = good.supply;
        seller_atom.atom_id = good.seller.atom_id;
        good_atom.seller = seller_atom;
        return good_atom;
      })
      .subscribe(good => {
        this.allGoods.push(good);
      });
  }
}
