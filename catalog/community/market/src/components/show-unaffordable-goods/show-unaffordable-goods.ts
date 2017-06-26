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
  transaction_price: number;
  seller: Party;
  buyer: Party;
}

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class ShowUnaffordableGoodsComponent {
  buyer = {atom_id: undefined};
  market = {atom_id: undefined}
  unaffordableGoods = [];

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (!this.buyer.atom_id || !this.market.atom_id) {
      return;
    }
    this.unaffordableGoods = [];
    this._graphQlService
      .get(`
        UnaffordableGoods(
          market_id: "${this.market.atom_id},
          buyer_id: "${this.buyer.atom_id}"
        ) {
          atom_id,
          name,
          offer_price,
          transaction_price,
          seller {
            atom_id
          },
          buyer {
            atom_id
          }
        }
      `)
      .map(data => data.UnaffordableGoods)
      .flatMap((goods, unused_ix) => Observable.from(goods))
      .map((good: Good) => {
        const good_atom: Good = this._clientBus.new_atom("Good");
        const seller_atom: Party = this._clientBus.new_atom("Party");
        const buyer_atom: Party = this._clientBus.new_atom("Party");
        good_atom.atom_id = good.atom_id;
        good_atom.name = good.name;
        good_atom.offer_price = good.offer_price;
        good_atom.transaction_price = good.transaction_price;
        seller_atom.atom_id = good.seller.atom_id;
        good_atom.seller = seller_atom;
        if (good.buyer) {
          buyer_atom.atom_id = good.buyer.atom_id;
          good_atom.buyer = buyer_atom;
        } else {
          good_atom.buyer = null;
        }
        return good_atom;
      })
      .subscribe(good => {
        this.unaffordableGoods.push(good);
      })
    ;
  }
}
