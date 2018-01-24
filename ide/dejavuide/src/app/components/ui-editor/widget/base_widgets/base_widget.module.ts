import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MatMenuModule, MatListModule } from '@angular/material';
import { FormsModule } from '@angular/forms';

import { LabelWidgetComponent } from './label_widget.component';
import { LinkWidgetComponent } from './link_widget.component';
import { ImageWidgetComponent } from './image_widget.component';
import { WidgetOptionsComponent } from './options.component';

@NgModule({
  declarations: [
    LabelWidgetComponent,
    LinkWidgetComponent,
    ImageWidgetComponent,
    WidgetOptionsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MatMenuModule,
    MatListModule
  ],
  providers: [],
  exports: [
    LabelWidgetComponent,
    LinkWidgetComponent,
    ImageWidgetComponent,
    WidgetOptionsComponent
  ]
})
export class BaseWidgetModule { }
