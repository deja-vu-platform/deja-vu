import {Widget, Field} from "client-bus";


@Widget({fqelement: "List", template: `{{item.name}}`})
export class ShowItemComponent {
  @Field("Item") item;
}
