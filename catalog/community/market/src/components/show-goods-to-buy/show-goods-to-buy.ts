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

@Widget({fqelement: "Market", ng2_providers: [GraphQlService]})
export class ShowGoodsToBuyComponent {
  market = {atom_id: "", goods: [], on_change: _ => undefined};
  private _fetched = undefined;

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    const update_goods = () => {
      if (!this.market.atom_id) {
        // get all goods if no market specified (TODO: deprecate this behavior)
        this._graphQlService
          .get(`
            good_all {
              atom_id,
              name,
              offer_price
            }
          `)
          .subscribe(data => {
            this.market.goods = data.good_all;
          })
        ;
      } else if (this.market.atom_id === this._fetched) {
        // don't fetch again if id hasn't changed
        return;
      } else {
        // get goods associated with market
        this._fetched = this.market.atom_id;
        this.market.goods = []; // clear array since we will append
        this._graphQlService
          .get(`
            market_by_id(atom_id: "${this.market.atom_id}") {
              goods {
                atom_id,
                name,
                offer_price
              }
            }
          `)
          .map(data => data.market_by_id.goods)
          .flatMap((goods, unused_ix) => Observable.from(goods))
          .map((good: Good) => {
            const good_atom: Good = this._clientBus.new_atom("Good");
            good_atom.atom_id = good.atom_id;
            good_atom.name = good.name;
            good_atom.offer_price = good.offer_price;
            return good_atom;
          })
          .subscribe(good => {
            this.market.goods.push(good);
          })
        ;
      }
    };
    update_goods();
    this.market.on_change(update_goods);
  }
}
