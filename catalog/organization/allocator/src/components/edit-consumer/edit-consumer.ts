import "rxjs/add/operator/toPromise";

import {Widget, Field, AfterInit} from "client-bus";
import {GraphQlService} from "gql";

import {ResourceAtom} from "../shared/data";


@Widget({fqelement: "Allocator", ng2_providers: [GraphQlService]})
export class EditConsumerComponent implements AfterInit {
  @Field("Resource") resource: ResourceAtom;
  consumer_atom_id = "";
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
        .then(consumer_atom_id =>
          this.consumer_atom_id = consumer_atom_id);
    };

    load_consumers();
    update_resource();
    this.resource.on_change(update_resource);
  }
}
