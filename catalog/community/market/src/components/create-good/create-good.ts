import {GraphQlService} from "gql";

import {Widget, Field, Atom} from "client-bus";

export interface GoodAtom extends Atom { name: string; offer_price: number; }


@Widget({fqelement: "Market", ng2_providers: [GraphQlService]})
export class CreateGoodComponent {
  @Field("Party") seller: Atom;
  @Field("Good") good: GoodAtom;

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    if (!this.seller.atom_id) return;

    this._graphQlService
      .post(`
        CreateGood(name: "${this.good.name}", 
          offer_price: ${this.good.offer_price}, 
          seller_id: "${this.seller.atom_id}") {
            atom_id
          }
      `)
      .subscribe(_ => {
        this.good.atom_id = "";
        this.good.name = "";
        this.good.offer_price = undefined;
      });
  }
}
