import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ProjectPreviewComponent } from './project-preview.component';
import { ProjectPreviewWidgetComponent} from './project-preview-widget.component';
import { WidgetDisplayModule } from '../../common/widget-display/widget-display.module';

@NgModule({
  declarations: [
    ProjectPreviewComponent,
    ProjectPreviewWidgetComponent
  ],
  imports: [
    BrowserModule,
    WidgetDisplayModule
  ],
  entryComponents: [
  ],
  providers: [],
  exports: [
    ProjectPreviewComponent
  ]
})
export class ProjectPreviewModule { }
