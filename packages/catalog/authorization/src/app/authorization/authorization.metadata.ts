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
export { AddViewerComponent };
import {
  AddRemoveViewerComponent
} from './add-remove-viewer/add-remove-viewer.component';
export { AddRemoveViewerComponent };
import {
  CanEditComponent
} from './can-edit/can-edit.component';
export { CanEditComponent };
import {
  CanViewComponent
} from './can-view/can-view.component';
export { CanViewComponent };
import { ConfigWizardComponent } from './config-wizard/config-wizard.component';
import {
  CreateResourceComponent
} from './create-resource/create-resource.component';
export { CreateResourceComponent };
import {
  DeleteResourceComponent
} from './delete-resource/delete-resource.component';
export { DeleteResourceComponent };
import {
  RemoveViewerComponent
} from './remove-viewer/remove-viewer.component';
export { RemoveViewerComponent };
import {
  ShowOwnerComponent
} from './show-owner/show-owner.component';
export { ShowOwnerComponent };
import {
  ShowResourceComponent
} from './show-resource/show-resource.component';
export { ShowResourceComponent };
import {
  ShowResourcesComponent
} from './show-resources/show-resources.component';
export { ShowResourcesComponent };
import {
  ShowResourceCountComponent
} from './show-resource-count/show-resource-count.component';
export { ShowResourceCountComponent };
import {
  VerifyCanEditComponent
} from './verify-can-edit/verify-can-edit.component';
export { VerifyCanEditComponent };
import {
  VerifyCanViewComponent
} from './verify-can-view/verify-can-view.component';
export { VerifyCanViewComponent };


const allComponents = [
  AddViewerComponent, AddRemoveViewerComponent,
  CanEditComponent, CanViewComponent,
  CreateResourceComponent, DeleteResourceComponent,
  RemoveViewerComponent, ShowOwnerComponent,
  ShowResourceComponent, ShowResourcesComponent, ShowResourceCountComponent,
  ConfigWizardComponent, VerifyCanEditComponent, VerifyCanViewComponent
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
