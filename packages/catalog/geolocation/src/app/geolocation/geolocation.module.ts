import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import { CreateMarkerComponent } from './create-marker/create-marker.component';
import { DeleteMarkerComponent } from './delete-marker/delete-marker.component';
import { DisplayMapComponent } from './display-map/display-map.component';
import { ShowMarkerComponent } from './show-marker/show-marker.component';
import { ShowMarkersComponent } from './show-markers/show-markers.component';


const allComponents = [
  CreateMarkerComponent,
  DeleteMarkerComponent,
  DisplayMapComponent,
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
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
})
export class GeolocationModule { }
