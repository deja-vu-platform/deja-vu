import "rxjs/add/observable/from";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/map";
import {Observable} from "rxjs/Observable";
import * as _u from "underscore";

import {Widget, ClientBus, Field} from "client-bus";
import {GraphQlService} from "gql";

import {MarkerAtom, MapAtom} from "../_shared/data";

@Widget({
  fqelement: "Location",
  ng2_providers: [GraphQlService]
})
export class OverlayMarkersComponent {
  @Field("Map") map: MapAtom;

  markers: MarkerAtom[] = [];

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.getMarkers();
  }

  getMarkers() {
    this._graphQlService
      .get(`
        getMarkersByMap(
          map_id: "${this.map.atom_id}"
        ) {
          atom_id,
          lat,
          lng,
          title
        }
      `)
      .map(data => data.getMarkersByMap)
      .flatMap((markers: MarkerAtom[], unused_ix) => Observable.from(markers))
      .map(marker =>
        _u.extendOwn(this._clientBus.new_atom<MarkerAtom>("Marker"), marker))
      .subscribe(marker => this.markers.push(marker));
  }
}
