import {Widget, ClientBus, Field} from "client-bus";
import {GraphQlService} from "gql";
import {MarkerAtom, MapAtom} from "../../shared/data";

import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/map";
import "rxjs/add/observable/from";
import "rxjs/add/operator/mergeMap";

import * as _u from "underscore";

@Widget({
  fqelement: "Map",
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
