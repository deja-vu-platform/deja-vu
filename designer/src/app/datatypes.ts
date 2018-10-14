import { Component } from '@angular/core';

export type BaseWidget = any; // TODO

export interface ComposedWidget {
  rows: Row[];
}

export interface Row {
  widgets: Widget[];
}

export type Widget = BaseWidget | ComposedWidget;

export interface Cliche {
  [componentName: string]: Component;
}
