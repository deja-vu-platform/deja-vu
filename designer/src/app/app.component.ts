import { Component } from '@angular/core';
import { filter } from 'rxjs/operators';
import { DragulaService } from 'ng2-dragula';

import { ComposedWidget, Widget } from './datatypes';
import { cliches } from './cliche/cliche.module';

// alphebetize cliches, putting Déjà Vu on top
const clicheList = Object.values(cliches)
  .sort(({ name: nameA }, { name: nameB }) => {
    if (nameA === nameB) { return 0; }
    if (nameA === 'Déjà Vu') { return -1; }
    if (nameB === 'Déjà Vu') { return 1; }
    return (nameA < nameB) ? -1 : 1;
  });

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

  // dragula needs to be configured at the top level
  constructor(private dragulaService: DragulaService) {
    this.configureDragula(dragulaService);
  }

  get clicheList() {
    return clicheList;
  }

  configureDragula(dragulaService: DragulaService) {
    dragulaService.createGroup('widget', {
      copy: (el, source) => source.classList.contains('widget-list'),
      accepts: (el, target) => target.classList.contains('page-row'),
    });

    dragulaService.drop('widget')
      .pipe(filter(({ el, source, target }) => !!el && !!source && !!target))
      .subscribe(({ el, source, target }) => {
        let targetRowIndex = parseInt(target['dataset'].index, 10);
        if (source.classList.contains('widget-list')) {
          const { cliche: clicheName, widget: widgetName } = el['dataset'];
          this.addWidget(targetRowIndex, clicheName, widgetName);
        } else if (source.classList.contains('page-row')) {
          const sourceRowIndex = parseInt(source['dataset'].index, 10);
          const widgetIndex = parseInt(el['dataset'].index, 10);
          const { widget, emptiedRow } = this.removeWidget(sourceRowIndex, widgetIndex);
          el.parentNode.removeChild(el); // delete old copy that Dragula leaves
          if (emptiedRow && sourceRowIndex < targetRowIndex) {
            targetRowIndex -= 1;
          }
          this.addWidget(targetRowIndex, widget.clicheName, widget.widgetName);
        }
      });
  }

  addWidget(rowIndex: number, clicheName: string, widgetName: string) {
    const component = cliches[clicheName].components[widgetName];
    this.composedWidget.rows[rowIndex].widgets.push({ clicheName, widgetName, component });
    // always end in empty row
    if (rowIndex === this.composedWidget.rows.length - 1) {
      this.composedWidget.rows.push({ widgets: [] });
    }
  }

  removeWidget(rowIndex: number, widgetIndex: number) {
    const [widget] = this.composedWidget.rows[rowIndex].widgets.splice(widgetIndex, 1);
    let emptiedRow = false;
    if (this.composedWidget.rows[rowIndex].widgets.length === 0) {
      this.composedWidget.rows.splice(rowIndex, 1);
      emptiedRow = true;
    }
    return { widget, emptiedRow };
  }
}
