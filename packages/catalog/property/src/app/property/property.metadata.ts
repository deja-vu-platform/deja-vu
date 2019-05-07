import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCheckboxModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatSelectModule,
  MatTableModule,
  MatTooltipModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import { ChooseObjectComponent } from './choose-object/choose-object.component';
export { ChooseObjectComponent };
import { CreateObjectComponent } from './create-object/create-object.component';
export { CreateObjectComponent };
import {
  CreateObjectsComponent
} from './create-objects/create-objects.component';
export { CreateObjectsComponent };
import {
   CamelToTitleCasePipe, CreatePropertyComponent
} from './create-property/create-property.component';
export { CreatePropertyComponent };
import {
  ObjectAutocompleteComponent
} from './object-autocomplete/object-autocomplete.component';
export { ObjectAutocompleteComponent };
import { ShowObjectComponent } from './show-object/show-object.component';
export { ShowObjectComponent };
import { ShowObjectsComponent } from './show-objects/show-objects.component';
export { ShowObjectsComponent };
import { ShowUrlComponent } from './show-url/show-url.component';
export { ShowUrlComponent };
import { ConfigWizardComponent } from './config-wizard/config-wizard.component';
import {
  TriStateCheckboxComponent
} from './tri-state-checkbox/tri-state-checkbox.component';


const publicComponents = [
  ChooseObjectComponent,
  CreateObjectComponent,
  CreateObjectsComponent,
  CreatePropertyComponent,
  ObjectAutocompleteComponent,
  ShowObjectComponent,
  ShowObjectsComponent,
  ShowUrlComponent,
  ConfigWizardComponent
];

const privateComponents = [
  TriStateCheckboxComponent
];

const metadata = {
  imports: [
    CommonModule,
    DvModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule
  ],
  declarations: [
    ...publicComponents,
    ...privateComponents,
    CamelToTitleCasePipe
  ],
  entryComponents: [...publicComponents, ...privateComponents],
  exports: [...publicComponents, CamelToTitleCasePipe]
};

export { metadata };
