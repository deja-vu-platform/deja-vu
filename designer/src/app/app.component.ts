import { Component } from '@angular/core';
import { filter } from 'rxjs/operators';
import { DragulaService } from 'ng2-dragula';

import { ComposedWidget } from './datatypes';
import { cliches } from './cliche/cliche.module';

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

  // dragula needs to be configured at the top-level
  constructor(private dragulaService: DragulaService) {
    this.configureDragula(dragulaService);
  }

  get clicheList() {
    return Object.values(cliches);
  }

  configureDragula(dragulaService: DragulaService) {
    dragulaService.createGroup('widget', {
      copy: (el, source) => source.classList.contains('widget-list'),
      accepts: (el, target) => target.classList.contains('page-row'),
    });

    dragulaService.drop('widget')
      .pipe(filter(({ el, source, target }) => !!el && !!source && !!target))
      .subscribe(({ el, source, target }) => {
        let component;
        if (source.classList.contains('widget-list')) {
          const { cliche: clicheName, component: componentName } = el['dataset'];
          component = cliches[clicheName].components[componentName];
        } else if (source.classList.contains('page-row')) {
          component = this.removeWidget(el, source);
        } else {
          return;
        }
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
