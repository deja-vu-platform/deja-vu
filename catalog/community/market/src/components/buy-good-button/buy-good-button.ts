import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class BuyGoodButtonComponent {
  good = {atom_id: undefined};
  buyer = {atom_id: undefined};
  quantityText: Element;
  fractionText: Element;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.quantityText = document.getElementById("quantity-text");
    this.fractionText = document.getElementById("fraction-text");
  }

  buyGood() {
    if (!this.good.atom_id || !this.buyer.atom_id) return;

    let quantity: number;
    if (this.quantityText) {
      quantity = parseInt(this.quantityText["value"]);
      if (isNaN(quantity)) {
        quantity = 1;
      }
    } else {
      quantity = 1;
    }
    let fraction: number;
    if (this.fractionText) {
      fraction = parseInt(this.fractionText["value"]);
      if (isNaN(quantity)) {
        fraction = 1;
      }
    } else {
      fraction = 1;
    }
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
}
