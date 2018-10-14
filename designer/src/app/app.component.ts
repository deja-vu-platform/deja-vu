import { Component } from '@angular/core';
import { filter } from 'rxjs/operators';
import { DragulaService } from 'ng2-dragula';

import * as EventCliche from 'event'; // TODO: proper import

import { ComposedWidget, Cliche, ClicheComponents } from './datatypes';
import { filterInPlace } from '../utils';

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
        { widgets: [] },
      ],
    },
  ];

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
    dragulaService.drop('widget')
      .pipe(filter(({ el, target }) => !!el && !!target))
      .subscribe(({ el, source, target }) => {
        const composedWidget = this.composedWidgets[0]; // TODO: active composed widget
        const { cliche: clicheName, component: componentName } = el['dataset'];
        const component = this.clicheMap[clicheName].components[componentName];
        // add widget to row
        const targetRowIndex = parseInt(target['dataset'].index, 10);
        composedWidget.rows[targetRowIndex].widgets.push(component);
        // remove widget from old location if dragged from row
        if (source.classList.contains('page-row')) {
          const sourceRowIndex = parseInt(source['dataset'].index, 10);
          const widgetIndex = parseInt(el['dataset'].index, 10);
          composedWidget.rows[sourceRowIndex].widgets.splice(widgetIndex, 1);
        }
        // remove empty rows
        filterInPlace(composedWidget.rows, r => r.widgets.length > 0);
        // always end in empty row
        composedWidget.rows.push({ widgets: [] });
      });
  }
}
