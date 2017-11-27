import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { LabelWidgetComponent } from './label_widget.component';
import { LinkWidgetComponent } from './link_widget.component';

@NgModule({
  declarations: [
    LabelWidgetComponent,
    LinkWidgetComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  exports: [
    LabelWidgetComponent,
    LinkWidgetComponent
  ]
})
export class BaseWidgetModule { }
