import { InjectionToken, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import { AgmCoreModule } from '@agm/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

import { CreateMarkerComponent } from './create-marker/create-marker.component';
import { DeleteMarkerComponent } from './delete-marker/delete-marker.component';
import { DisplayMapComponent } from './display-map/display-map.component';
import {
  GetCurrentLocationComponent
} from './get-current-location/get-current-location.component';
import { ShowMarkerComponent } from './show-marker/show-marker.component';
import { ShowMarkersComponent } from './show-markers/show-markers.component';

import { GOOGLE_MAPS_API_KEY } from './geolocation.config';


const allComponents = [
  CreateMarkerComponent,
  DeleteMarkerComponent,
  DisplayMapComponent,
  GetCurrentLocationComponent,
  ShowMarkerComponent,
  ShowMarkersComponent
];

const metadata = {
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
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
};

export { metadata };
