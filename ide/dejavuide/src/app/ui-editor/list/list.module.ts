import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ListComponent } from './list.component';
import { ListItemModule } from './list-item/list-item.module';

@NgModule({
  declarations: [
    ListComponent
  ],
  imports: [
    CommonModule,
    ListItemModule
  ],
  providers: [],
  exports: [
    ListComponent
  ]
})
export class ListModule { }
