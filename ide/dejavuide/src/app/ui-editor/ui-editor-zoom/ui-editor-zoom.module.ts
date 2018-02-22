import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { UiEditorZoomComponent } from './ui-editor-zoom.component';
import { ZoomModule } from '../../common/zoom/zoom.module';

@NgModule({
  declarations: [
    UiEditorZoomComponent
  ],
  imports: [
    BrowserModule,
    ZoomModule
  ],
  providers: [],
  exports: [
    UiEditorZoomComponent
  ]
})
export class UiEditorZoomModule { }
