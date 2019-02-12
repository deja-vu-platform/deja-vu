import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

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


const allComponents = [
  AddViewerComponent, AddRemoveViewerComponent,
  CanEditComponent, CanViewComponent,
  CreateResourceComponent, DeleteResourceComponent,
  RemoveViewerComponent, ShowOwnerComponent,
  ShowResourceComponent, ShowResourcesComponent
];

const metadata = {
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
};

export { metadata };