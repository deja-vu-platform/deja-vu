import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MatMenuModule, MatListModule } from '@angular/material';
import { FormsModule } from '@angular/forms';

import { LabelWidgetComponent } from './label-widget.component';
import { LinkWidgetComponent } from './link-widget.component';
import { ImageWidgetComponent } from './image-widget.component';
import { MenuWidgetComponent } from './menu-widget.component';
import { PanelWidgetComponent } from './panel-widget.component';
import { TabWidgetComponent } from './tab-widget.component';

import { UserWidgetComponent } from './user-widget.component';
import { WidgetOptionsComponent } from './options.component';


@NgModule({
  declarations: [
    LabelWidgetComponent,
    LinkWidgetComponent,
    ImageWidgetComponent,
    WidgetOptionsComponent,
    MenuWidgetComponent,
    PanelWidgetComponent,
    TabWidgetComponent,
    UserWidgetComponent
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
    WidgetOptionsComponent,
    MenuWidgetComponent,
    PanelWidgetComponent,
    TabWidgetComponent,
    UserWidgetComponent
  ]
})
export class WidgetOptionsModule { }
