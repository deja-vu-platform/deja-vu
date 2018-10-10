import { Component } from '@angular/core';
import { DragulaService } from 'ng2-dragula';

import * as EventComponents from 'event'; // TODO: proper import

import { ComposedWidget } from './datatypes';
import { filterInPlace } from '../utils';

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

  // dragula needs to be configured at the top-level
  constructor(private dragulaService: DragulaService) {
    dragulaService.createGroup('widget', {
      copy: (el, source) => source.classList.contains('widget-list'),
      accepts: (el, target) => target.classList.contains('page-row'),
    });
    dragulaService.drop('widget')
      .subscribe(({ el, source, target }) => {
        const composedWidget = this.composedWidgets[0]; // TODO: active composed widget
        const component = EventComponents.ɵe; // TODO: dragged component
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
        console.log(composedWidget.rows);
      });
  }
}
