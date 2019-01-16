import { Component } from '@angular/core';
import * as _ from 'lodash';
import { DragulaService } from 'ng2-dragula';
import { filter } from 'rxjs/operators';

import { clicheDefinitions, designerCliche } from './cliche.module';
import {
  ActionInstance,
  App,
  ClicheDefinition,
  ClicheInstance,
  Row
} from './datatypes';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  viewProviders: [DragulaService]
})
export class AppComponent {
  app = new App('new-app'); // TODO: create new or load from saved
  openAction = this.app.homepage;

  // dragula needs to be configured at the top level
  constructor(private dragulaService: DragulaService) {
    this.configureDragula();
    // instantiate each cliche once (TODO: dynamic instantiations)
    _.forEach(clicheDefinitions, (of) => {
      this.app.cliches.push(new ClicheInstance(of.name, of));
    });
  }

  configureDragula() {
    this.dragulaService.createGroup('action', {
      copy: (el, source) => source.classList.contains('action-list'),
      accepts: (el, target) => target.classList.contains('dvd-row')
    });

    this.dragulaService.drop('action')
      .pipe(
        filter(({ el: e, source: s, target: t }) => e && s && t && (s !== t))
      )
      .subscribe(({ el, source, target }) => {
        let action: ActionInstance;
        const toRowIdx = parseInt(target['dataset'].index, 10);
        const toRow = this.openAction.rows[toRowIdx] || new Row();
        if (source.classList.contains('action-list')) {
          const { source: sourceName, action: actionName } = el['dataset'];
          action = this.newWidget(sourceName, actionName);
        } else if (source.classList.contains('dvd-row')) {
          const fromRowIdx = parseInt(source['dataset'].index, 10);
          const actionIdx = parseInt(el['dataset'].index, 10);
          action = this.openAction.rows[fromRowIdx].removeAction(actionIdx);
        } else {
          return; // TODO: refactor to make better use of RxJS
        }
        el.parentNode.removeChild(el); // delete copy that Dragula leaves
        toRow.addAction(action);
        if (toRowIdx === -1) {
          this.openAction.rows.push(toRow);
        }
      });
  }

  newWidget(sourceName: string, actionName: string): ActionInstance {
    if (sourceName === this.app.name) {
      throw new Error('Support for nested App Actions is not yet implemented');
    }

    const source: ClicheDefinition = sourceName === designerCliche.name
      ? designerCliche
      : this.app.cliches.find((c) => c.name === sourceName).of;
    const actionDefinition = source.actions.find((a) => a.name === actionName);

    return new ActionInstance(actionDefinition);
  }
}
