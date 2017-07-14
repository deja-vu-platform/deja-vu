import {Widget, Field, PrimitiveAtom} from "client-bus";

@Widget({
  fqelement: "Market"
})
export class BuyGoodFractionComponent {
  @Field("number") fraction: PrimitiveAtom<number>;
}
