import { Component } from '@angular/core';
import { filter } from 'rxjs/operators';
import { DragulaService } from 'ng2-dragula';

import * as EventCliche from 'event'; // TODO: proper import

import { ComposedWidget, Cliche, ClicheComponents } from './datatypes';

const importedCliches = {
  Event: EventCliche,
};

function restoreComponentNames(importedComponents) {
  const namedComponents: ClicheComponents = {};
  Object.values(importedComponents)
    .filter(f => f['name'].endsWith('Component'))
    .forEach(c => namedComponents[c['name'].slice(0, -9)] = c);
  return namedComponents;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  viewProviders: [DragulaService],
})
export class AppComponent {
  composedWidgets: ComposedWidget[] = [
    {
      rows: [
        { widgets: [] },
      ],
    },
  ];
  composedWidget = this.composedWidgets[0]; // TODO: dynamic

  cliches: Cliche[] = [];
  clicheMap: { [clicheName: string]: Cliche } = {}; // redundant, for performance & clarity

  // dragula needs to be configured at the top-level
  constructor(private dragulaService: DragulaService) {
    this.loadCliches();
    this.configureDragula(dragulaService);
  }

  loadCliches() {
    Object.entries(importedCliches).forEach(([name, clicheModule]) => {
      const components = restoreComponentNames(clicheModule);
      const cliche = { name, components };
      this.cliches.push(cliche);
      this.clicheMap[name] = cliche;
    });
  }

  configureDragula(dragulaService: DragulaService) {
    dragulaService.createGroup('widget', {
      copy: (el, source) => source.classList.contains('widget-list'),
      accepts: (el, target) => target.classList.contains('page-row'),
    });

    const dropStream = dragulaService.drop('widget')
      .pipe(filter(({ el, source, target }) => !!el && !!source && !!target));

    dropStream.pipe(filter(({ source }) => source.classList.contains('widget-list')))
      .subscribe(({ el, target }) => {
        const { cliche: clicheName, component: componentName } = el['dataset'];
        const component = this.clicheMap[clicheName].components[componentName];
        this.addWidget(target, component);
      });

    dropStream.pipe(filter(({ source }) => source.classList.contains('page-row')))
      .subscribe(({ el, source, target }) => {
        const component = this.removeWidget(el, source);
        this.addWidget(target, component);
      });
  }

  addWidget(targetRowElement, componentToAdd) {
    const targetRowIndex = parseInt(targetRowElement['dataset'].index, 10);
    this.composedWidget.rows[targetRowIndex].widgets.push(componentToAdd);
    // always end in empty row
    if (targetRowIndex === this.composedWidget.rows.length - 1) {
      this.composedWidget.rows.push({ widgets: [] });
    }
  }

  removeWidget(widgetElement, rowElement) {
    const sourceRowIndex = parseInt(rowElement['dataset'].index, 10);
    const widgetIndex = parseInt(widgetElement['dataset'].index, 10);
    const [component] = this.composedWidget.rows[sourceRowIndex].widgets.splice(widgetIndex, 1);
    if (this.composedWidget.rows[sourceRowIndex].widgets.length === 0) {
      this.composedWidget.rows.splice(sourceRowIndex, 1);
    }
    return component;
  }
}
