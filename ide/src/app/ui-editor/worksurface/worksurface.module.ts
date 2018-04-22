import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { WidgetModule } from '../widget/widget.module';
import { WorkSurfaceComponent } from './worksurface.component';

@NgModule({
  declarations: [
    WorkSurfaceComponent
  ],
  imports: [
    WidgetModule,
    CommonModule
  ],
  providers: [],
  exports: [
    WorkSurfaceComponent
  ]
})
export class WorkSurfaceModule { }
