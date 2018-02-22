import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { WidgetModule } from '../widget/widget.module';
import { WorkSurfaceComponent } from './worksurface.component';

@NgModule({
  declarations: [
    WorkSurfaceComponent
  ],
  imports: [
    WidgetModule,
    BrowserModule
  ],
  providers: [],
  exports: [
    WorkSurfaceComponent
  ]
})
export class WorkSurfaceModule { }
