import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import { CreateObjectComponent } from './create-object/create-object.component';
import {
  CreatePropertyComponent
} from './create-property/create-property.component';
import { ShowObjectComponent } from './show-object/show-object.component';

const allComponents = [
  CreateObjectComponent, ShowObjectComponent, CreatePropertyComponent
];


@NgModule({
  imports: [
    CommonModule,
    DvModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatButtonModule, MatInputModule,
    MatFormFieldModule
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
})
export class PropertyModule { }
