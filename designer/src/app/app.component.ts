import { Component } from '@angular/core';
import { DragulaService } from 'ng2-dragula';

import { ɵe as CreateWeeklySeriesComponent } from 'event'; // TODO: proper import

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
        { widgets: [CreateWeeklySeriesComponent] },
      ],
    },
  ];

  // dragula needs to be configured at the top-level
  constructor(private dragulaService: DragulaService) {
    dragulaService.createGroup('widget', {
      copy: (el, source) => source.classList.contains('widget-list'),
      accepts: (el, target) => target.classList.contains('page-row'),
    });
    // dragulaService.drop('widget').subscribe(({ target }) => {
    //   target.
    // });
  }
}
