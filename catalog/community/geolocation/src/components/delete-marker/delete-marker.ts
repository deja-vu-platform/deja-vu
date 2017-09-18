import {Widget, Field, PrimitiveAtom, ClientBus, WidgetValue} from "client-bus";
import {GraphQlService} from "gql";

import {MarkerAtom} from "../_shared/data";


@Widget({
    fqelement: "Geolocation",
    ng2_providers: [GraphQlService]
  })
export class DeleteMarkerComponent {
    @Field("Marker") marker: MarkerAtom;
    @Field("Widget") on_delete_ok: PrimitiveAtom<WidgetValue>;


    constructor(private _graphQlService: GraphQlService,
                private _client_bus: ClientBus) {}

    deleteMarker() {
        // Trigger delete action if button is clicked.
        // N.B. For post requests, it is necessary to have a subsection.
        this._graphQlService
            .post(`
                deleteMarker (
                    marker_id: "${this.marker.atom_id}"
                ) {
                    atom_id
                }
            `)
            // TODO: Redirect after deleting the marker.
            // .subscribe(
            //     atom_id => {
            //         this._client_bus.navigate(this.on_delete_ok.value);
            //     }
            // );
    }
}
