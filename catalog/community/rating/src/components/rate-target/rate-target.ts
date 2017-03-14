import {GraphQlService} from "gql";

import {Widget} from "client-bus";

@Widget({
  fqelement: "dv-community-rating",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class RateTargetComponent {
  constructor(private _graphQlService: GraphQlService) {}
}
