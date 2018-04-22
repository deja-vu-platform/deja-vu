import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ProjectPreviewComponent } from './project-preview.component';
import { ProjectPreviewWidgetComponent} from './project-preview-widget.component';
import { WidgetDisplayModule } from '../../shared/widget-display/widget-display.module';

@NgModule({
  declarations: [
    ProjectPreviewComponent,
    ProjectPreviewWidgetComponent
  ],
  imports: [
    CommonModule,
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
