import {GraphQlService} from "gql";

import {Widget, Field, Atom} from "client-bus";


@Widget({fqelement: "Market", ng2_providers: [GraphQlService]})
export class AffordTableComponent {
  @Field("Party") buyer: Atom;
  affordableGoods = [];
  unaffordableGoods = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.buyer.atom_id === undefined) return;

    this._graphQlService
      .get(`
        AffordableGoods(buyer_id: "${this.buyer.atom_id}"){
          atom_id,
          name,
          offer_price
        }
      `)
      .subscribe(data => {
        this.affordableGoods = data.AffordableGoods;
      });

    this._graphQlService
      .get(`
        UnaffordableGoods(buyer_id: "${this.buyer.atom_id}"){
          atom_id,
          name,
          offer_price
        }
      `)
      .subscribe(data => {
        this.unaffordableGoods = data.UnaffordableGoods;
      });
  }
}
