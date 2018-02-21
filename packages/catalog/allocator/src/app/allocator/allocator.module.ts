import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateResourceComponent } from './create-resource/create-resource.component';
import { CreateAllocationComponent } from './create-allocation/create-allocation.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [CreateResourceComponent, CreateAllocationComponent]
})
export class AllocatorModule { }
