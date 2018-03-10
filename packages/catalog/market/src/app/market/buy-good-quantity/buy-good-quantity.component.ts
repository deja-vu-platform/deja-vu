import {Widget, Field, PrimitiveAtom} from "client-bus";

@Widget({
  fqelement: "Market"
})
export class BuyGoodQuantityComponent {
  @Field("number") quantity: PrimitiveAtom<number>;
}
