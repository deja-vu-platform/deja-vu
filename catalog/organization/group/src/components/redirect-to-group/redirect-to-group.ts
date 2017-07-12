import {Widget, ClientBus, Field, PrimitiveAtom, WidgetValue} from "client-bus";

import {GroupAtom} from "../../shared/data";

@Widget({fqelement: "Group"})
export class RedirectToGroupComponent {
  @Field("Group") group: GroupAtom;
  @Field("Widget") on_redirect: PrimitiveAtom<WidgetValue>;

  constructor(private _clientBus: ClientBus) {}

  navigate() {
    this._clientBus.navigate(this.on_redirect.value);
  }
}
