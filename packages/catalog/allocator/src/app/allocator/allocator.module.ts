import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatButtonModule, MatInputModule, MatFormFieldModule,
  MatSelectModule
} from '@angular/material';

import { DvModule } from 'dv-core';

import { AllocatorServiceFactory } from './shared/allocator.service';

import { CreateResourceComponent } from './create-resource/create-resource.component';
import { CreateAllocationComponent } from './create-allocation/create-allocation.component';
import { ShowConsumerComponent } from './show-consumer/show-consumer.component';
import { EditConsumerComponent } from './edit-consumer/edit-consumer.component';
import { DeleteResourceComponent } from './delete-resource/delete-resource.component';

const allComponents = [
  CreateResourceComponent, CreateAllocationComponent,
  ShowConsumerComponent, EditConsumerComponent,
  DeleteResourceComponent
];

@NgModule({
  imports: [
    DvModule,
    CommonModule,
    FormsModule,
    BrowserAnimationsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule,
    MatSelectModule
  ],
  providers: [AllocatorServiceFactory],
  declarations: allComponents,
  exports: allComponents,
})
export class AllocatorModule { }
