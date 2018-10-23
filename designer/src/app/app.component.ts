import { Component } from '@angular/core';
import { filter } from 'rxjs/operators';
import { DragulaService } from 'ng2-dragula';

import { ComposedWidget, BaseWidget, TextWidget } from './datatypes';
import { cliches } from './cliche/cliche.module';

const DV = 'Déjà Vu';

// alphebetize cliches, putting Déjà Vu on top
const clicheList = Object.values(cliches)
  .sort(({ name: nameA }, { name: nameB }) => {
    if (nameA === nameB) { return 0; }
    if (nameA === DV) { return -1; }
    if (nameB === DV) { return 1; }
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
    new ComposedWidget(),
  ];

  composedWidget = this.composedWidgets[0]; // TODO: dynamic

  // dragula needs to be configured at the top level
  constructor(private dragulaService: DragulaService) {
    this.configureDragula(this.dragulaService);
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
      .pipe(filter(({ el, source, target }) => !!el && !!source && !!target && source !== target))
      .subscribe(({ el, source, target }) => {
        let widget;
        if (source.classList.contains('widget-list')) {
          const { cliche: clicheName, widget: widgetName } = el['dataset'];
          widget = this.newWidget(clicheName, widgetName);
        } else if (source.classList.contains('page-row')) {
          widget = this.composedWidget.removeWidget(el.id);
          el.parentNode.removeChild(el); // delete old copy that Dragula leaves
        } else {
          return; // TODO: refactor to make better use of RxJS
        }
        this.composedWidget.addWidget(widget, target.id);
      });
  }

  newWidget(clicheName, widgetName): BaseWidget {
    if (clicheName === 'Déjà Vu' && widgetName === 'Text') {
      return new TextWidget();
    }
    return new BaseWidget(clicheName, widgetName);
  }
}
