import { Component } from '@angular/core';

import * as uuidv4 from 'uuid/v4';

import { cliches } from './cliche/cliche.module';

export interface Widget {
  readonly id: string;
  readonly base: boolean;
  readonly data: { [key: string]: any };
}

export interface Row {
  readonly id: string;
  readonly widgets: Widget[];
}

export class BaseWidget implements Widget {
  readonly id: string;
  readonly base: boolean;
  readonly data: { [key: string]: any } = {};
  readonly clicheName: string;
  readonly widgetName: string;
  readonly component: Component;

  constructor(clicheName: string, widgetName: string) {
    this.id = uuidv4();
    this.base = true;
    this.clicheName = clicheName;
    this.widgetName = widgetName;
    try {
      this.component = cliches[clicheName].components[widgetName];
    } catch (e) {
      this.component = undefined;
    }
    if (!this.component) {
      throw new Error(`Component for widget ${widgetName} in cliché ${clicheName} not found.`);
    }
  }
}

export class TextWidget extends BaseWidget {
  data: { [key: string]: any, content: '' };
  constructor() {
    super('Déjà Vu', 'Text');
  }

  set content(newContent) {
    this.data.content = newContent;
  }

  get content() {
    return this.data.content;
  }
}

export class ComposedWidget implements Widget {
  readonly id: string;
  readonly base: boolean;
  readonly data: { [key: string]: any } = {};
  readonly rows: Row[] = [];

  constructor() {
    this.id = uuidv4();
    this.base = false;
  }

  addWidget(widget: Widget, rowID?: string) {
    const row = this.rows.find(r => r.id === rowID);
    if (row) {
      row.widgets.push(widget);
    } else {
      this.rows.push({ id: uuidv4(), widgets: [widget] });
    }
    return widget;
  }

  removeWidget(widgetID: string): Widget {
    const { rowIndex, widgetIndex } = this.findWidget(widgetID);
    if (rowIndex === -1 || widgetIndex === -1) { return null; }
    const [widget] = this.rows[rowIndex].widgets.splice(widgetIndex, 1);
    if (this.rows[rowIndex].widgets.length === 0) {
      this.rows.splice(rowIndex, 1);
    }
    return widget;
  }

  private findWidget(widgetID: string): { rowIndex: number, widgetIndex: number } {
    for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex += 1) {
      const row = this.rows[rowIndex];
      for (let widgetIndex = 0; widgetIndex < row.widgets.length; widgetIndex += 1) {
        const widget = row.widgets[widgetIndex];
        if (widget.id === widgetID) {
          return { rowIndex, widgetIndex };
        }
      }
    }
    return { rowIndex: -1 , widgetIndex: -1 };
  }
}

export interface Cliche {
  readonly name: string;
  readonly components: ClicheComponents;
}

export interface ClicheComponents {
  [componentName: string]: Component;
}
