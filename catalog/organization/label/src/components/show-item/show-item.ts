import {Widget, Field} from "client-bus";

import {ItemAtom} from "../../shared/data";

@Widget({
  fqelement: "Label",
  template: `{{item.name}}`
})
export class ShowItemComponent {
  @Field("Item") item : ItemAtom;

  // TODO: load name from db
}
