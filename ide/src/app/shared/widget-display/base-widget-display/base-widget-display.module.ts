import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatMenuModule, MatListModule } from '@angular/material';
import { FormsModule } from '@angular/forms';

import { LabelWidgetDisplayComponent } from './label-widget-display.component';
import { LinkWidgetDisplayComponent } from './link-widget-display.component';
import { ImageWidgetDisplayComponent } from './image-widget-display.component';
import { MenuWidgetDisplayComponent } from './menu-widget-display.component';
import { PanelWidgetDisplayComponent } from './panel-widget-display.component';
import { TabWidgetDisplayComponent } from './tab-widget-display.component';

import { UserWidgetDisplayComponent } from './user-widget-display.component';


@NgModule({
  declarations: [
    LabelWidgetDisplayComponent,
    LinkWidgetDisplayComponent,
    ImageWidgetDisplayComponent,
    MenuWidgetDisplayComponent,
    PanelWidgetDisplayComponent,
    TabWidgetDisplayComponent,
    UserWidgetDisplayComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatListModule
  ],
  providers: [],
  exports: [
    LabelWidgetDisplayComponent,
    LinkWidgetDisplayComponent,
    ImageWidgetDisplayComponent,
    MenuWidgetDisplayComponent,
    PanelWidgetDisplayComponent,
    TabWidgetDisplayComponent,
    UserWidgetDisplayComponent
  ]
})
export class BaseWidgetDisplayModule { }
