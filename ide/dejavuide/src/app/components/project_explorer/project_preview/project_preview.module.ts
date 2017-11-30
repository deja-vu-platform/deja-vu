import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ProjectPreviewComponent } from './project_preview.component';

@NgModule({
  declarations: [
    ProjectPreviewComponent
  ],
  imports: [
    BrowserModule,
  ],
  entryComponents: [
  ],
  providers: [],
  exports: [
    ProjectPreviewComponent
  ]
})
export class ProjectPreviewModule { }
