import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ProjectPreviewComponent } from './project-preview.component';
import { ProjectPreviewWidgetComponent} from './project-preview-widget.component';


@NgModule({
  declarations: [
    ProjectPreviewComponent,
    ProjectPreviewWidgetComponent
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
