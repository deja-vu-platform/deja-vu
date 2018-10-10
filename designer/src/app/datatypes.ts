export type BaseWidget = any; // TODO

export interface ComposedWidget {
  rows: Row[];
}

export interface Row {
  widgets: Widget[];
}

export type Widget = BaseWidget | ComposedWidget;
