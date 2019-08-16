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
import { Ng5SliderModule }  from 'ng5-slider';

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
  CreatePropertyComponent
} from './create-property/create-property.component';
export { CreatePropertyComponent };
import {
  FilterObjectsComponent
} from './filter-objects/filter-objects.component';
export { FilterObjectsComponent };
import {
  ObjectAutocompleteComponent
} from './object-autocomplete/object-autocomplete.component';
export { ObjectAutocompleteComponent };
import { RemoveObjectComponent } from './remove-object/remove-object.component';
export { RemoveObjectComponent };
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
import { UpdateObjectComponent } from './update-object/update-object.component';
import {
  UpdateObjectsComponent
} from './update-objects/update-objects.component';

const publicComponents = [
  ChooseObjectComponent,
  CreateObjectComponent,
  CreateObjectsComponent,
  CreatePropertyComponent,
  FilterObjectsComponent,
  ObjectAutocompleteComponent,
  RemoveObjectComponent,
  ShowObjectComponent,
  ShowObjectsComponent,
  ShowUrlComponent,
  UpdateObjectComponent,
  UpdateObjectsComponent,
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
    Ng5SliderModule,
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
    ...privateComponents
  ],
  entryComponents: [...publicComponents, ...privateComponents],
  exports: [...publicComponents]
};

export { metadata };
