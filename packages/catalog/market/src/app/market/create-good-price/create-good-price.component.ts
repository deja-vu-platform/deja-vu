import {Widget, Field} from "client-bus";
import {GoodAtom} from "../../shared/data";

@Widget({
  fqelement: "Market"
})
export class CreateGoodPriceComponent {
  @Field("Good") good: GoodAtom;
}
