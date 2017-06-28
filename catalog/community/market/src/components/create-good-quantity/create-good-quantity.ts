import {Widget} from "client-bus";

@Widget({
  fqelement: "Market"
})
export class CreateGoodQuantityComponent {
  good = {
    atom_id: "",
    name: "",
    price: 0,
    quantity: 1
  };
  constructor() {}
}
