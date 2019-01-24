import { Component, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { DragulaService } from 'ng2-dragula';
import { filter } from 'rxjs/operators';

import { clicheDefinitions, designerCliche } from './cliche.module';
import {
  ActionInstance,
  App,
  AppActionDefinition,
  ClicheDefinition,
  ClicheInstance,
  Row,
  ActionDefinition
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
  constructor(
    private dragulaService: DragulaService,
    private zone: NgZone,
    private snackBar: MatSnackBar
  ) {
    this.configureDragula();
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
    const source: App | ClicheDefinition | ClicheInstance = [
      this.app,
      designerCliche,
      ...this.app.cliches
    ].find((s) => s.name === sourceName);
    const actionDefinition = (<ActionDefinition[]>source.actions)
      .find((a) => a.name === actionName);

    return new ActionInstance(actionDefinition, source);
  }

  load(appJSON: string) {
    this.zone.run(() => {
      this.app = App.fromJSON(appJSON, clicheDefinitions, designerCliche);
      this.openAction = this.app.homepage;
      this.snackBar.open('Save has been loaded.', 'dismiss', {
        duration: 2500
      });
    });
  }

  onActionChanged(openAction: AppActionDefinition) {
    this.openAction = openAction;
  }
}
