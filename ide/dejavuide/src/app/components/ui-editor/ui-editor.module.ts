import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { UiEditorComponent } from './ui-editor.component';
import { UiEditorZoomModule } from './ui-editor-zoom/ui-editor-zoom.module';
import { MapModule } from './map/map.module';
import { WorkSurfaceModule } from './worksurface/worksurface.module';
import { ListModule } from './list/list.module';
import { PaletteModule } from './palette/palette.module';

@NgModule({
  declarations: [
    UiEditorComponent
  ],
  imports: [
    BrowserModule,
    UiEditorZoomModule,
    MapModule,
    WorkSurfaceModule,
    ListModule,
    PaletteModule
  ],
  exports: [
    UiEditorComponent
  ]
})
export class UiEditorModule { }
