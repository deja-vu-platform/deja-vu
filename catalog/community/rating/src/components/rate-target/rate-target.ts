import {GraphQlService} from "gql";

import {Widget} from "client-bus";

@Widget({
  fqelement: "dv-community-rating",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class RateTargetComponent {
  target = {atom_id: ""};
  source = {atom_id: ""};
  rating = 0;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    // TODO: Do something intererting
  }
}
