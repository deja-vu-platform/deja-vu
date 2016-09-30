import {Component} from "angular2/core";
import {GraphQlService} from "gql";


@Component({
  selector: "consumer",
  template: `{{consumer.atom_id}}`,
  inputs: ["allocation", "resource"]
})
export class ConsumerComponent {
  allocation = {on_change: undefined};
  resource = {on_change: undefined};
  consumer = {atom_id: ""};

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    const update_consumer = () => {
      if (!this.allocation.atom_id || !this.resource.atom_id) return;
      this._graphQlService
        .get(`
          allocation_by_id(atom_id: "${this.allocation.atom_id}") {
            consumer(resource_id: "${this.resource.atom_id}") {
              atom_id
            }
          }
        `)
        .map(data => data.allocation_by_id.consumer)
        .subscribe(consumer => this.consumer = consumer);
    };
    update_consumer();
    this.allocation.on_change(update_consumer);
    this.resource.on_change(update_consumer);
  }
}
