import { Component, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { DragulaService } from 'ng2-dragula';
import { ElectronService } from 'ngx-electron';
import { filter } from 'rxjs/operators';

import { clicheDefinitions, dvCliche } from './cliche.module';
import {
  ActionDefinition,
  ActionInstance,
  App,
  AppActionDefinition,
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
  app = new App('newapp');
  openAction = this.app.homepage;

  addCliche: (cliche: ClicheInstance) => void;
  nextPort = 3002;
  processes: {[name: string]: {kill: (s: string) => void }} = {};

  constructor(
    private dragulaService: DragulaService,
    private zone: NgZone,
    private snackBar: MatSnackBar,
    private electronService: ElectronService
  ) {
    window['dv-designer'] = true; // alters how cliche server finds actions
    this.configureDragula(); // dragula needs to be configured at the top level
    this.startBackend();
  }

  /**
   * Must run in constructor
   */
  private configureDragula() {
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
          const {
            source: sourceName,
            action: actionName,
            disabled
          } = el['dataset'];
          if (disabled !== 'true') {
            action = this.newWidget(sourceName, actionName);
          }
        } else if (source.classList.contains('dvd-row')) {
          const fromRowIdx = parseInt(source['dataset'].index, 10);
          const actionIdx = parseInt(el['dataset'].index, 10);
          action = this.openAction.rows[fromRowIdx].removeAction(actionIdx);
        } else {
          return;
        }
        el.parentNode.removeChild(el); // delete copy that Dragula leaves
        if (action) {
          toRow.addAction(action);
          if (toRowIdx === -1) {
            this.openAction.rows.push(toRow);
          }
        }
      });
  }

  /**
   * Generate a new Action Instance for the given action from the given cliche
   */
  private newWidget(sourceName: string, actionName: string): ActionInstance {
    const source: App | ClicheDefinition | ClicheInstance = [
      this.app,
      dvCliche,
      ...this.app.cliches
    ].find((s) => s.name === sourceName);
    const actionDefinition = (<ActionDefinition[]>source.actions)
      .find((a) => a.name === actionName);

    return new ActionInstance(actionDefinition, source);
  }

  /**
   * Start the gateway, if we are in electron
   * Also populates the addCliche method
   * Must run in constructor
   */
  private startBackend() {
    if (this.electronService.remote) {
      const path = this.electronService.remote.require('path');
      const cp = this.electronService.remote.require('child_process');
      const gateway = this.electronService.remote.require('dv-gateway');
      const cli = this.electronService.remote.require('dv-cli');

      const requestProcessor = gateway.startGateway();

      /**
       * Start the cliche server
       */
      this.addCliche = (cliche) => {
        requestProcessor.addCliche(cliche.of.name, this.nextPort, cliche.name);
        const serverPath = path.join(path.dirname(
          cli.locatePackage(cliche.of.name)), '..', 'server', 'server.js');
        const configObj = Object.assign({wsPort: this.nextPort}, cliche.config);
        const configStr = JSON.stringify(JSON.stringify(configObj));
        let command = `node ${serverPath} --config ${configStr}`;
        if (cliche.name !== cliche.of.name) {
          command += ` --as ${cliche.name}`;
        }
        this.processes[cliche.name] = cp.spawn(command, [], { shell: true });
        this.nextPort += 1;
      };

    } else {
      this.addCliche = () => { };
    }
  }

  /**
   * Stop the cliche server, if one is running
   */
  removeCliche(clicheName: string) {
    const childProcess = this.processes[clicheName];
    if (childProcess) {
      childProcess.kill('SIGINT');
    }
  }

  load(appJSON: string) {
    this.zone.run(() => {
      this.app = App.fromJSON(appJSON, clicheDefinitions, dvCliche);
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
