import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import {MarkerAtom} from "../_shared/data";


@Widget({
    fqelement: "Geolocation",
    ng2_providers: [GraphQlService]
  })
export class DeleteMarkerComponent {
    @Field("Marker") marker: MarkerAtom;

    constructor(private _graphQlService: GraphQlService) {}

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
                atom_id => { console.log("delete marker"); }
            );
    }
}
