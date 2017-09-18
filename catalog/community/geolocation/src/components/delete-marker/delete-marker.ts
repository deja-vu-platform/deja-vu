import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {MarkerAtom} from "../_shared/data";


@Widget({
    fqelement: "Geolocation",
    ng2_providers: [GraphQlService]
  })
export class DeleteMarkerComponent {
    @Field("Marker") marker: MarkerAtom;
    @Field("boolean") delete_ok: PrimitiveAtom<boolean>;


    constructor(private _graphQlService: GraphQlService) {}

    /**
     * Deletes a marker.
     * N.B. Must have a subsection in the post request and must subscribe to it.
     */
    deleteMarker() {
        this._graphQlService
            .post(`
                deleteMarker (
                    marker_id: "${this.marker.atom_id}"
                ) {
                    atom_id
                }
            `)
            .subscribe(
                atom_id => {
                    this.delete_ok.value = true;
                }
            );
    }
}
