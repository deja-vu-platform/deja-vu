import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { UiEditorComponent } from './ui-editor.component';
import { ZoomModule } from './zoom/zoom.module';
import { MapModule } from './map/map.module';
import { WorkSurfaceModule } from './worksurface/worksurface.module';
import { ListModule } from './list/list.module';
import { PaletteModule } from './palette/palette.module';

import { UiEditorRoutingModule } from './ui-editor-routing.module';

@NgModule({
  declarations: [
    UiEditorComponent
  ],
  imports: [
    BrowserModule,
    ZoomModule,
    MapModule,
    WorkSurfaceModule,
    ListModule,
    PaletteModule,
    UiEditorRoutingModule
  ],
  exports: [
    UiEditorComponent
  ]
})
export class UiEditorModule { }
