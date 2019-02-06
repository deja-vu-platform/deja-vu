import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@dejavu-lang/core';

import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { AgmCoreModule } from '@agm/core';

import { CreateMarkerComponent } from './create-marker/create-marker.component';
import { DeleteMarkerComponent } from './delete-marker/delete-marker.component';
import { DisplayMapComponent } from './display-map/display-map.component';
import {
  GetCurrentLocationComponent
} from './get-current-location/get-current-location.component';
import { ShowMarkerComponent } from './show-marker/show-marker.component';
import { ShowMarkersComponent } from './show-markers/show-markers.component';

export {
  CreateMarkerComponent, DeleteMarkerComponent, DisplayMapComponent,
  GetCurrentLocationComponent, ShowMarkerComponent, ShowMarkersComponent
}

import { API_PATH, GOOGLE_MAPS_API_KEY } from './geolocation.config';


const allComponents = [
  CreateMarkerComponent,
  DeleteMarkerComponent,
  DisplayMapComponent,
  GetCurrentLocationComponent,
  ShowMarkerComponent,
  ShowMarkersComponent
];

@NgModule({
  imports: [
    BrowserModule,
    CommonModule,
    DvModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    LeafletModule.forRoot(),
    AgmCoreModule.forRoot({
      apiKey: GOOGLE_MAPS_API_KEY
    })
  ],
  providers: [{ provide: API_PATH, useValue: '/graphql' }],
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
})
export class GeolocationModule { }
