import {Widget, ClientBus} from "client-bus";


@Widget({fqelement: "List"})
export class RedirectToItemComponent {
  item = {atom_id: "", name: ""};
  on_redirect = {value: undefined};

  constructor(private _clientBus: ClientBus) {}

  navigate() {
    this._clientBus.navigate(this.on_redirect.value);
  }
}
