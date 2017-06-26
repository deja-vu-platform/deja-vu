import {GraphQlService} from "gql";

import {Widget, ClientBus} from "client-bus";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";


export interface Good {
  atom_id: string;
  name: string;
  offer_price: number;
}

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class ShowMyGoodsForSaleComponent {
  seller = {atom_id: undefined};
  market = {atom_id: undefined}
  forSaleGoods = [];

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (!this.seller.atom_id || !this.market.atom_id) {
      return;
    }
    this.forSaleGoods = [];
    this._graphQlService
      .get(`
        GoodsFromSeller(
          seller_id: "${this.seller.atom_id}",
          market_id: "${this.market.atom_id}"
        ) {
          atom_id,
          name,
          offer_price
        }
      `)
      .map(data => data.GoodsFromSeller)
      .flatMap((goods, unused_ix) => Observable.from(goods))
      .map((good: Good) => {
        const good_atom: Good = this._clientBus.new_atom("Good");
        good_atom.atom_id = good.atom_id;
        good_atom.name = good.name;
        good_atom.offer_price = good.offer_price;
        return good_atom;
      })
      .subscribe(good => {
        this.forSaleGoods.push(good);
      })
    ;
  }
}
