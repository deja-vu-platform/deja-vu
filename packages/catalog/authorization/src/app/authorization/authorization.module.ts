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
  AddRemoveViewerComponent
} from './add-remove-viewer/add-remove-viewer.component';
import {
  CanEditComponent
} from './can-edit/can-edit.component';
import {
  CanViewComponent
} from './can-view/can-view.component';
import {
  CreateResourceComponent
} from './create-resource/create-resource.component';
import {
  DeleteResourceComponent
} from './delete-resource/delete-resource.component';
import {
  RemoveViewerComponent
} from './remove-viewer/remove-viewer.component';
import {
  ShowOwnerComponent
} from './show-owner/show-owner.component';
import {
  ShowResourceComponent
} from './show-resource/show-resource.component';
import {
  ShowResourcesComponent
} from './show-resources/show-resources.component';

import { API_PATH } from './authorization.config';


const allComponents = [
  AddViewerComponent, AddRemoveViewerComponent,
  CanEditComponent, CanViewComponent,
  CreateResourceComponent, DeleteResourceComponent,
  RemoveViewerComponent, ShowOwnerComponent,
  ShowResourceComponent, ShowResourcesComponent
];

@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    DvModule,
    FormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule
  ],
  providers: [{ provide: API_PATH, useValue: '/graphql' }],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
})
export class AuthorizationModule { }
