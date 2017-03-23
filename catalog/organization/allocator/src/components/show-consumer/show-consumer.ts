import {Widget} from "client-bus";
import {GraphQlService} from "gql";


@Widget({
  fqelement: "Allocator",
  template: `{{consumer.name}}`,
  ng2_providers: [GraphQlService]
})
export class ShowConsumerComponent {
  allocation = {atom_id: undefined, on_change: _ => undefined};
  resource = {atom_id: undefined, on_change: _ => undefined};
  consumer = {atom_id: "", name: ""};

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    /**
     * Retrieve and update the consumer object, given an atom ID.
     *
     * @param {string} consumer_atom_id ID of the consumer atom to retrieve
     */
    const update_consumer = (consumer_atom_id) => {
      if (!consumer_atom_id) return;
      this._graphQlService
        .get(`
          consumer_by_id(atom_id: "${consumer_atom_id}") {
            name,
            atom_id
          }
        `)
        .map(data => data.consumer_by_id)
        .subscribe(consumer => this.consumer = consumer);
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
        .subscribe(consumer_atom_id => update_consumer(consumer_atom_id));
    };

    update_resource();
    this.allocation.on_change(update_resource);
    this.resource.on_change(update_resource);
  }
}
