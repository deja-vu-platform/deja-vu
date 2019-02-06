import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule, MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@dejavu-lang/core';

import { ChooseObjectComponent } from './choose-object/choose-object.component';
import { CreateObjectComponent } from './create-object/create-object.component';
import {
  CreateObjectsComponent
} from './create-objects/create-objects.component';
import {
   CamelToTitleCasePipe, CreatePropertyComponent
} from './create-property/create-property.component';
import {
  ObjectAutocompleteComponent
} from './object-autocomplete/object-autocomplete.component';
import { ShowObjectComponent } from './show-object/show-object.component';
import { ShowObjectsComponent } from './show-objects/show-objects.component';
import { ShowUrlComponent } from './show-url/show-url.component';

import { API_PATH } from './property.config';

const allComponents = [
  ChooseObjectComponent, CreateObjectComponent, CreateObjectsComponent,
  CreatePropertyComponent, ObjectAutocompleteComponent,
  ShowObjectComponent, ShowObjectsComponent, ShowUrlComponent
];


@NgModule({
  imports: [
    CommonModule,
    DvModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatAutocompleteModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatSelectModule
  ],
  providers: [ { provide: API_PATH, useValue: '/graphql' } ],
  declarations: [...allComponents, CamelToTitleCasePipe],
  entryComponents: allComponents,
  exports: [...allComponents, CamelToTitleCasePipe]
})
export class PropertyModule { }
