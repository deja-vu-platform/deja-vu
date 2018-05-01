import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatMenuModule, MatListModule } from '@angular/material';
import { FormsModule } from '@angular/forms';

import { LabelWidgetOptionsComponent } from './label-widget-options.component';
import { LinkWidgetOptionsComponent } from './link-widget-options.component';
import { ImageWidgetOptionsComponent } from './image-widget-options.component';
import { MenuWidgetOptionsComponent } from './menu-widget-options.component';
import { PanelWidgetOptionsComponent } from './panel-widget-options.component';
import { TabWidgetOptionsComponent } from './tab-widget-options.component';

import { UserWidgetOptionsComponent } from './user-widget-options.component';

import { WidgetOptionsComponent } from './widget-options.component';


@NgModule({
  declarations: [
    LabelWidgetOptionsComponent,
    LinkWidgetOptionsComponent,
    ImageWidgetOptionsComponent,
    WidgetOptionsComponent,
    MenuWidgetOptionsComponent,
    PanelWidgetOptionsComponent,
    TabWidgetOptionsComponent,
    UserWidgetOptionsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatListModule
  ],
  providers: [],
  exports: [
    LabelWidgetOptionsComponent,
    LinkWidgetOptionsComponent,
    ImageWidgetOptionsComponent,
    WidgetOptionsComponent,
    MenuWidgetOptionsComponent,
    PanelWidgetOptionsComponent,
    TabWidgetOptionsComponent,
    UserWidgetOptionsComponent
  ]
})
export class WidgetOptionsModule { }
