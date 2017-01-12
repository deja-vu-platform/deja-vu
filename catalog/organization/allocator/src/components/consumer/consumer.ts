import {Widget} from "client-bus";
import {GraphQlService} from "gql";


@Widget({template: `{{consumer.atom_id}}`, ng2_providers: [GraphQlService]})
export class ConsumerComponent {
  allocation = {atom_id: undefined, on_change: _ => undefined};
  resource = {atom_id: undefined, on_change: _ => undefined};
  consumer = {atom_id: ""};

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    const update_consumer = () => {
      if (!this.allocation.atom_id || !this.resource.atom_id) return;
      this._graphQlService
        .get(`
          resource_by_id(atom_id: "${this.resource.atom_id}") {
            consumed_by {
              atom_id
            }
          }
        `)
        .map(data => data.resource_by_id.consumed_by)
        .subscribe(consumer => this.consumer = consumer);
    };
    update_consumer();
    this.allocation.on_change(update_consumer);
    this.resource.on_change(update_consumer);
  }
}
