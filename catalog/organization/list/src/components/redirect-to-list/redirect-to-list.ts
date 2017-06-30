import {Widget, ClientBus, Field, PrimitiveAtom, WidgetValue} from "client-bus";
import {ListAtom} from "../shared/data";


@Widget({fqelement: "List"})
export class RedirectToListComponent {
  @Field("List") list: ListAtom;
  @Field("Widget") on_redirect: PrimitiveAtom<WidgetValue>;

  constructor(private _clientBus: ClientBus) {}

  navigate() {
    this._clientBus.navigate(this.on_redirect.value);
  }
}
