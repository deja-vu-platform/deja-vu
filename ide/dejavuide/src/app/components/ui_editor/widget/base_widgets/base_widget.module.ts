import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MatMenuModule } from '@angular/material';

import { LabelWidgetComponent } from './label_widget.component';
import { LinkWidgetComponent } from './link_widget.component';

@NgModule({
  declarations: [
    LabelWidgetComponent,
    LinkWidgetComponent
  ],
  imports: [
    BrowserModule,
    MatMenuModule
  ],
  providers: [],
  exports: [
    LabelWidgetComponent,
    LinkWidgetComponent
  ]
})
export class BaseWidgetModule { }
