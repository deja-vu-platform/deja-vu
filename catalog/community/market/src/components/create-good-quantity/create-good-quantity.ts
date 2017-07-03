import {Widget, Field} from "client-bus";
import {GoodAtom} from "../../shared/data";

@Widget({
  fqelement: "Market"
})
export class CreateGoodQuantityComponent {
  @Field("Good") good: GoodAtom;
}
