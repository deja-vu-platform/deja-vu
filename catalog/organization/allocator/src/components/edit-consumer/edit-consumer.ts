import {Widget} from "client-bus";
import {GraphQlService} from "gql";

@Widget({fqelement: "Allocator", ng2_providers: [GraphQlService]})
export class EditConsumerComponent {
  allocation = {atom_id: undefined, on_change: _ => undefined};
  consumer_atom_id = "";
  resource = {atom_id: undefined, on_change: _ => undefined};
  consumers = [];

  constructor(private _graphQlService: GraphQlService) {}

  updateSelection(newSelection) {
    this._graphQlService
      .post(`
        editChampion(
          resource_atom_id: "${this.resource.atom_id}",
          champion_atom_id: "${newSelection}")
      `)
      .subscribe(res => {
        if (res) {
          this.consumer_atom_id = newSelection;
        }
      });
  }

  dvAfterInit() {
    /**
     * Load all consumers from the remote server. These are shown to the user
     * so they can decide who the champion is.
     */
    const load_consumers = () => {
      this._graphQlService
        .get(`
          consumer_all {
            name,
            atom_id
          }
        `)
        .map(data => data.consumer_all)
        .subscribe(consumers => this.consumers = consumers);
    };

    /**
     * Retrieve a resource object, triggering an update of the consumer object.
     */
    const update_resource = () => {
      if (!this.allocation.atom_id || !this.resource.atom_id) return;
      this._graphQlService
        .get(`
          resource_by_id(atom_id: "${this.resource.atom_id}") {
            consumed_by {
              atom_id
            }
          }
        `)
        .map(data => data.resource_by_id.consumed_by.atom_id)
        .subscribe(consumer_atom_id =>
          this.consumer_atom_id = consumer_atom_id);
    };

    load_consumers();
    update_resource();
    this.allocation.on_change(update_resource);
    this.resource.on_change(update_resource);
  }
}
