import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { UiEditorComponent } from './ui_editor.component';
import { ZoomModule } from './zoom/zoom.module';
import { MapModule } from './map/map.module';
import { WorkSurfaceModule } from './worksurface/worksurface.module';

@NgModule({
  declarations: [
    UiEditorComponent
  ],
  imports: [
    BrowserModule,
    ZoomModule,
    MapModule,
    WorkSurfaceModule,
  ],
  exports: [
    UiEditorComponent
  ]
})
export class UiEditorModule { }
