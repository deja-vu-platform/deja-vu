import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { UiEditorComponent } from './ui-editor.component';
import { UiEditorZoomModule } from './ui-editor-zoom/ui-editor-zoom.module';
import { MapModule } from './map/map.module';
import { WorkSurfaceModule } from './worksurface/worksurface.module';
import { ListModule } from './list/list.module';
import { PaletteModule } from './palette/palette.module';

import { PaletteService } from './services/palette.service';
import { StateService } from './services/state.service';

@NgModule({
  declarations: [
    UiEditorComponent
  ],
  imports: [
    CommonModule,
    UiEditorZoomModule,
    MapModule,
    WorkSurfaceModule,
    ListModule,
    PaletteModule,
  ],
  providers: [
    StateService,
    PaletteService,
  ],
  exports: [
    UiEditorComponent
  ]
})
export class UiEditorModule { }
