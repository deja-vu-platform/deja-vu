import {Widget} from "client-bus";

@Widget({
  fqelement: "Market"
})
export class CreateGoodPriceComponent {
  good = {
    atom_id: "",
    name: "",
    price: 0,
    quantity: 1
  };
  constructor() {}
}
