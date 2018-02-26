import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateResourceComponent } from './create-resource/create-resource.component';
import { CreateAllocationComponent } from './create-allocation/create-allocation.component';
import { ShowConsumerComponent } from './show-consumer/show-consumer.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [CreateResourceComponent, CreateAllocationComponent, ShowConsumerComponent]
})
export class AllocatorModule { }
