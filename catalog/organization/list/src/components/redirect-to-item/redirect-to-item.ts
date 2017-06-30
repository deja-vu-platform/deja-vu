import {Widget, ClientBus, Field, WidgetValue, PrimitiveAtom} from "client-bus";
import {ItemAtom} from "../shared/data";


@Widget({fqelement: "List"})
export class RedirectToItemComponent {
  @Field("Item") item: ItemAtom;
  @Field("Widget") on_redirect: PrimitiveAtom<WidgetValue>;

  constructor(private _clientBus: ClientBus) {}

  navigate() {
    this._clientBus.navigate(this.on_redirect.value);
  }
}
