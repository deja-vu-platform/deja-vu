import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MatMenuModule, MatListModule } from '@angular/material';

import { LabelWidgetComponent } from './label_widget.component';
import { LinkWidgetComponent } from './link_widget.component';
import { WidgetOptionsComponent } from './options.component';

@NgModule({
  declarations: [
    LabelWidgetComponent,
    LinkWidgetComponent,
    WidgetOptionsComponent
  ],
  imports: [
    BrowserModule,
    MatMenuModule,
    MatListModule
  ],
  providers: [],
  exports: [
    LabelWidgetComponent,
    LinkWidgetComponent
  ]
})
export class BaseWidgetModule { }
