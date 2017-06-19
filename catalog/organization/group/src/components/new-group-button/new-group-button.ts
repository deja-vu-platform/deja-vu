import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class NewGroupButtonComponent {
  submit_ok = {value: false};

  constructor(
      private _graphQlService: GraphQlService) {}

  submit() {
    this.submit_ok.value = true;
  }

  valid() {
    return true; // TODO: actually validate
  }
}
