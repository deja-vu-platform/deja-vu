import {Widget, ClientBus, field} from "client-bus";


@Widget({
  fqelement: "List",
  template: `
    <div class="list-group">
      <div class="list-group-item-text">
        <dv-widget name="ShowList"></dv-widget>
      </div>
      <div class="list-group-item-text">
        <dv-widget name="AddItem"></dv-widget>
      </div>
    </div>
  `
})
export class EditListComponent {
  list = {atom_id: ""};

  constructor(client_bus: ClientBus) {
    client_bus.init(this, [field("list", "List")]);
  }
}
