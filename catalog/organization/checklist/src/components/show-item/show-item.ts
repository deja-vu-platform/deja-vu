import {Widget, Field} from "client-bus";


@Widget({fqelement: "Checklist", template: `{{item.name}}`})
export class ShowItemComponent {
  @Field("Item") item;
}
