import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class BuyGoodButtonComponent {
  good = {atom_id: undefined};
  buyer = {atom_id: undefined};
  quantity = {value: 1};
  fraction = {value: 1};

  constructor(private _graphQlService: GraphQlService) {}

  buyGood() {
    console.log(this.quantity);
    if (!this.good.atom_id || !this.buyer.atom_id) return;

    // let quantity: number;
    // if (this.quantity) {
    //   quantity = parseInt(this.quantity);
    //   if (isNaN(quantity)) {
    //     quantity = 1;
    //   }
    // } else {
    //   quantity = 1;
    // }
    // let fraction: number;
    // if (this.fraction) {
    //   fraction = parseInt(this.fraction);
    //   if (isNaN(fraction)) {
    //     fraction = 1;
    //   }
    // } else {
    //   fraction = 1;
    // }
    const quantity = this.quantity.value;
    const fraction = this.fraction.value;
    this._graphQlService
      .post(`
        BuyGood(
          good_id: "${this.good.atom_id}",
          buyer_id: "${this.buyer.atom_id}",
          quantity: ${quantity},
          fraction: ${fraction}
        )
      `)
      .subscribe(res => undefined)
    ;
  }

  valid() {
    return (this.good.atom_id && this.buyer.atom_id);
  }
}
