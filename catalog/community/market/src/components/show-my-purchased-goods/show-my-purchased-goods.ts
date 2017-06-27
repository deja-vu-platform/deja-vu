import {GraphQlService} from "gql";

import {Widget, ClientBus} from "client-bus";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

export interface Party {
  atom_id: string;
}

export interface Good {
  atom_id: string;
  name: string;
  offer_price: number;
  seller: Party;
  amount_available: number;
}

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class ShowMyPurchasedGoodsComponent {
  buyer = {atom_id: undefined};
  market = {atom_id: undefined}
  purchasedGoods = [];

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (!this.buyer.atom_id || !this.market.atom_id) {
      return;
    }
    this.purchasedGoods = [];
    this._graphQlService
      .get(`
        GoodsFromBuyer(
          buyer_id: "${this.buyer.atom_id}",
          market_id: "${this.market.atom_id}"
        ) {
          atom_id,
          name,
          offer_price,
          seller {
            atom_id
          },
          amount_available
        }
      `)
      .map(data => data.GoodsFromBuyer)
      .flatMap((goods, unused_ix) => Observable.from(goods))
      .map((good: Good) => {
        const good_atom: Good = this._clientBus.new_atom("Good");
        const seller_atom: Party = this._clientBus.new_atom("Party");
        const buyer_atom: Party = this._clientBus.new_atom("Party");
        good_atom.atom_id = good.atom_id;
        good_atom.name = good.name;
        good_atom.offer_price = good.offer_price;
        good_atom.amount_available = good.amount_available;
        seller_atom.atom_id = good.seller.atom_id;
        good_atom.seller = seller_atom;
        return good_atom;
      })
      .subscribe(good => {
        this.purchasedGoods.push(good);
      })
    ;
  }
}
