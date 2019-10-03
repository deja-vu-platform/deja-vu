import { CommonModule } from '@angular/common';
import { InjectionToken, ModuleWithProviders } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import { AgmCoreModule } from '@agm/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

import { CreateMarkerComponent } from './create-marker/create-marker.component';
export { CreateMarkerComponent };
import {
  CreateMarkerFromMapComponent
} from './create-marker-from-map/create-marker-from-map.component';
export { CreateMarkerFromMapComponent };
import { ConfigWizardComponent } from './config-wizard/config-wizard.component';
import { DeleteMarkerComponent } from './delete-marker/delete-marker.component';
export { DeleteMarkerComponent };
import { DisplayMapComponent } from './display-map/display-map.component';
export { DisplayMapComponent };
import {
  GetCurrentLocationComponent
} from './get-current-location/get-current-location.component';
export { GetCurrentLocationComponent };
import { ShowMarkerComponent } from './show-marker/show-marker.component';
export { ShowMarkerComponent };
import { ShowMarkersComponent } from './show-markers/show-markers.component';
export { ShowMarkersComponent };
import {
  ShowMarkerCountComponent
} from './show-marker-count/show-marker-count.component';
export { ShowMarkerCountComponent };
import { UpdateMarkerFromMapComponent } from './update-marker-from-map/update-marker-from-map.component';
export { UpdateMarkerFromMapComponent };

import { GOOGLE_MAPS_API_KEY } from './geolocation.config';

const allComponents = [
  CreateMarkerComponent,
  CreateMarkerFromMapComponent,
  DeleteMarkerComponent,
  DisplayMapComponent,
  GetCurrentLocationComponent,
  ShowMarkerComponent,
  ShowMarkersComponent,
  ShowMarkerCountComponent,
  UpdateMarkerFromMapComponent,
  ConfigWizardComponent
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
