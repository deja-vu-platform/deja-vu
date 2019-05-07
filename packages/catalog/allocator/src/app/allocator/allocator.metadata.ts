import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import {
  CreateAllocationComponent
} from './create-allocation/create-allocation.component';
export { CreateAllocationComponent };
import {
  DeleteResourceComponent
} from './delete-resource/delete-resource.component';
export { DeleteResourceComponent };
import { ConfigWizardComponent } from './config-wizard/config-wizard.component';
import { EditConsumerComponent } from './edit-consumer/edit-consumer.component';
export { EditConsumerComponent };
import { ShowConsumerComponent } from './show-consumer/show-consumer.component';
export { ShowConsumerComponent };


const allComponents = [
  CreateAllocationComponent, ShowConsumerComponent, EditConsumerComponent,
  DeleteResourceComponent, ConfigWizardComponent
];

const metadata = {
  imports: [
    DvModule,
    CommonModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule,
    MatSelectModule
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
};

export { metadata };
