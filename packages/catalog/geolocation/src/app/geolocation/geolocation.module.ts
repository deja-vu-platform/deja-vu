import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateMarkerButtonComponent } from './create-marker-button/create-marker-button.component';
import { CreateMarkerPositionComponent } from './create-marker-position/create-marker-position.component';
import { CreateMarkerTitleComponent } from './create-marker-title/create-marker-title.component';
import { DeleteMarkerComponent } from './delete-marker/delete-marker.component';
import { DisplayMapComponent } from './display-map/display-map.component';
import { MarkerInfoWindowComponent } from './marker-info-window/marker-info-window.component';
import { OverlayMarkerComponent } from './overlay-marker/overlay-marker.component';
import { OverlayMarkersComponent } from './overlay-markers/overlay-markers.component';
import { SearchForPlaceComponent } from './search-for-place/search-for-place.component';
import { ShowMarkerLocationComponent } from './show-marker-location/show-marker-location.component';
import { SharedComponent } from './-shared/-shared.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [CreateMarkerButtonComponent, CreateMarkerPositionComponent, CreateMarkerTitleComponent, DeleteMarkerComponent, DisplayMapComponent, MarkerInfoWindowComponent, OverlayMarkerComponent, OverlayMarkersComponent, SearchForPlaceComponent, ShowMarkerLocationComponent, SharedComponent]
})
export class GeolocationModule { }
