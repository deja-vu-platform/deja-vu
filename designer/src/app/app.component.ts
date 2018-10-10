import { Component } from '@angular/core';
import { DragulaService } from 'ng2-dragula';

import * as EventComponents from 'event'; // TODO: proper import

import { ComposedWidget } from './datatypes';

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
        { widgets: [], index: 0 },
        { widgets: [], index: 1 },
      ],
    },
  ];

  // dragula needs to be configured at the top-level
  constructor(private dragulaService: DragulaService) {
    dragulaService.createGroup('widget', {
      copy: (el, source) => source.classList.contains('widget-list'),
      accepts: (el, target) => target.classList.contains('page-row'),
    });
    dragulaService.drop('widget').subscribe(({ target }) => {
      const composedWidget = this.composedWidgets[0]; // TODO: active composed widget
      const index = parseInt(target['dataset'].index, 10);
      const component = EventComponents.ɵe;
      composedWidget.rows[index].widgets.push(component); // TODO: dragged component
      const lastRowIndex = composedWidget.rows.length - 1;
      if (index === lastRowIndex) {
        composedWidget.rows.push({ widgets: [], index: lastRowIndex + 1 });
      }
    });
    console.log(Object.keys(EventComponents));
  }
}
