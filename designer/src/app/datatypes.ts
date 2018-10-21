import { Component } from '@angular/core';

// TODO: nested composed widgets

export interface ComposedWidget {
  rows: Row[];
}

export interface Row {
  widgets: Widget[];
}

export interface Widget {
  clicheName: string;
  widgetName: string;
  component: Component;
}

export interface Cliche {
  name: string;
  components: ClicheComponents;
}

export interface ClicheComponents {
  [componentName: string]: Component;
}
