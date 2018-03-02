import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { UiEditorZoomComponent } from './ui-editor-zoom.component';
import { ZoomModule } from '../../shared/zoom/zoom.module';

@NgModule({
  declarations: [
    UiEditorZoomComponent
  ],
  imports: [
    CommonModule,
    ZoomModule
  ],
  providers: [],
  exports: [
    UiEditorZoomComponent
  ]
})
export class UiEditorZoomModule { }
