import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@dejavu-lang/core';

import {
  CreateAllocationComponent
} from './create-allocation/create-allocation.component';
import {
  DeleteResourceComponent
} from './delete-resource/delete-resource.component';
import { EditConsumerComponent } from './edit-consumer/edit-consumer.component';
import { ShowConsumerComponent } from './show-consumer/show-consumer.component';

import { API_PATH } from './allocator.config';


const allComponents = [
  CreateAllocationComponent, ShowConsumerComponent, EditConsumerComponent,
  DeleteResourceComponent
];

@NgModule({
  imports: [
    DvModule,
    CommonModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule,
    MatSelectModule
  ],
  providers: [ { provide: API_PATH, useValue: '/graphql' } ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
})
export class AllocatorModule { }
