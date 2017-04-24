import {GraphQlService} from "gql";

import {Widget} from "client-bus";

@Widget({
  fqelement: "List",
  ng2_providers: [GraphQlService]
})
export class ShowItemCheckedComponent {
  item = {atom_id: "", name: "", checked: false};

  constructor(
      private _graphQlService: GraphQlService) {}
}
