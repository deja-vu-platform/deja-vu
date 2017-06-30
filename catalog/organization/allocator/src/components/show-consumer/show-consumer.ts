import "rxjs/add/operator/toPromise";

import {Widget, Field, AfterInit} from "client-bus";
import {GraphQlService} from "gql";

import {ResourceAtom, Consumer} from "../shared/data";


@Widget({
  fqelement: "Allocator",
  template: `{{consumer.name}}`,
  ng2_providers: [GraphQlService]
})
export class ShowConsumerComponent implements AfterInit {
  @Field("Resource") resource: ResourceAtom;
  consumer: Consumer;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    /**
     * Retrieve and update the consumer object, given an atom ID.
     *
     * @param {string} consumer_atom_id ID of the consumer atom to retrieve
     */
    const update_consumer = (consumer_atom_id) => {
      if (!consumer_atom_id) return;
      return this._graphQlService
        .get(`
          consumer_by_id(atom_id: "${consumer_atom_id}") {
            name,
            atom_id
          }
        `)
        .toPromise()
        .then(data => data.consumer_by_id)
        .then(consumer => this.consumer = consumer);
    };

    /**
     * Retrieve a resource object, triggering an update of the consumer object.
     */
    const update_resource = () => {
      if (!this.resource.atom_id) return;
      return this._graphQlService
        .get(`
          resource_by_id(atom_id: "${this.resource.atom_id}") {
            assigned_to {
              atom_id
            }
          }
        `)
        .toPromise()
        .then(data => data.resource_by_id.assigned_to.atom_id)
        .then(consumer_atom_id => update_consumer(consumer_atom_id));
    };

    update_resource();
    this.resource.on_change(update_resource);
  }
}
