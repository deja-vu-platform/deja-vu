import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {MarkerAtom} from "../_shared/data";

@Widget({
  fqelement: "Location",
  ng2_providers: [GraphQlService]
})
export class CreateMarkerTitleComponent {
  @Field("Marker") marker: MarkerAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      if (
        this.marker.atom_id && this.marker.title
      ) {
        this._graphQlService
          .get(`
            marker_by_id(
              atom_id: "${this.marker.atom_id}"
            ) {
              update(
                title: "${this.marker.title}"
              ) {
                atom_id
              }
            }
          `)
          .subscribe(_ => {
            this.marker.title = "";
          });
      }
    });
  }

}
