import { CommonModule } from '@angular/common';
import { ApplicationRef, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import { DisplayMapComponent } from './display-map/display-map.component';

import { AgmCoreModule } from '@agm/core';

const allComponents = [
  DisplayMapComponent
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
    FormsModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyBbPL7hviCiMdW7ZkIuq119PuidXV0epwY'
    })
  ],
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
})
export class GeolocationModule { }
