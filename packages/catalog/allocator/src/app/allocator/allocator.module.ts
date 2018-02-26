import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatInputModule, MatFormFieldModule } from '@angular/material';

import { DvModule } from 'dv-core';

import { CreateResourceComponent } from './create-resource/create-resource.component';
import { CreateAllocationComponent } from './create-allocation/create-allocation.component';
import { ShowConsumerComponent } from './show-consumer/show-consumer.component';

const allComponents = [
  CreateResourceComponent, CreateAllocationComponent, ShowConsumerComponent
];

@NgModule({
  imports: [
    DvModule,
    CommonModule,
    FormsModule,
    BrowserAnimationsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule
  ],
  declarations: allComponents,
  exports: allComponents,
})
export class AllocatorModule { }
