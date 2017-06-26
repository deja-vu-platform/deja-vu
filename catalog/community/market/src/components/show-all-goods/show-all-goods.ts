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
export class ShowAllGoodsComponent {
  market = {atom_id: "", goods: [], on_change: _ => undefined};
  private _fetched = undefined;

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    const update_goods = () => {
      if (!this.market.atom_id || this.market.atom_id === this._fetched) {
        return;
      }
      // get goods associated with market
      this._fetched = this.market.atom_id;
      this.market.goods = []; // clear array since we will append
      this._graphQlService
        .get(`
          market_by_id(atom_id: "${this.market.atom_id}") {
            goods {
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
          }
        `)
        .map(data => data.market_by_id.goods)
        .flatMap((goods, unused_ix) => Observable.from(goods))
        .map((good: Good) => {
          console.log("Good", good);
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
          this.market.goods.push(good);
        })
      ;
    };
    update_goods();
    this.market.on_change(update_goods);
  }
}
