import {GraphQlService} from "gql";
import {Widget, Field} from "client-bus";
import {GoodAtom} from "../../shared/data";

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class CreateGoodNameComponent {
  @Field("Good") good: GoodAtom;
}
