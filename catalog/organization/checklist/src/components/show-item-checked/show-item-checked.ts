import {Widget, Field} from "client-bus";


@Widget({fqelement: "Checklist"})
export class ShowItemCheckedComponent {
  @Field("Item") item;
}
