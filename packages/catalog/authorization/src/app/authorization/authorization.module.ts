import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import {
  AddViewerComponent
} from './add-viewer/add-viewer.component';
import {
  CreatePrincipalComponent
} from './create-principal/create-principal.component';
import {
  CreateResourceComponent
} from './create-resource/create-resource.component';
import {
  DeleteResourceComponent
} from './delete-resource/delete-resource.component';

const allComponents = [
  AddViewerComponent, CreatePrincipalComponent,
  CreateResourceComponent, DeleteResourceComponent
];

@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    DvModule,
    FormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
})
export class AuthorizationModule { }
