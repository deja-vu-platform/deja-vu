import {Widget, Field} from "client-bus";
import {GoodAtom} from "../../shared/data";

@Widget({
  fqelement: "Market"
})
export class CreateGoodNameComponent {
  @Field("Good") good: GoodAtom;
}
