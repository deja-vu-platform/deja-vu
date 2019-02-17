import { Component, NgZone, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import * as _ from 'lodash';
import { DragulaService } from 'ng2-dragula';
import { ElectronService } from 'ngx-electron';
import { filter } from 'rxjs/operators';

import {
  ActionInstance,
  App,
  AppActionDefinition,
  ClicheInstance,
  Row
} from './datatypes';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  viewProviders: [DragulaService]
})
export class AppComponent implements OnDestroy {
  app = new App('newapp');
  openAction = this.app.homepage;

  private nextPort = 3002;
  private readonly processes: {[n: string]: { kill: (s: string) => void }} = {};
  private readonly setElectronState: (state: any) => void;
  private readonly requestProcessor: any; // dv-gateway.DesignerRequestProcessor
  private readonly path: any; // path module
  private readonly cp: any; // child_process module
  private readonly cli: any; // dv-cli module

  constructor(
    private readonly dragulaService: DragulaService,
    private readonly zone: NgZone,
    private readonly snackBar: MatSnackBar,
    private readonly electronService: ElectronService
  ) {
    window['dv-designer'] = true; // alters how cliche server finds actions
    this.configureDragula(); // dragula needs to be configured at the top level
    // start the backend
    if (this.electronService.remote) {
      // we save the reqP to avoid needing to start and stop the gateway
      const myElectron = this.electronService.remote.require('./electron.js');
      this.requestProcessor = myElectron.getState();
      if (!this.requestProcessor) {
        const gateway = this.electronService.remote.require('@deja-vu/gateway');
        this.requestProcessor = gateway.startGateway(); // port 3000 default
        myElectron.setState(this.requestProcessor);
      }

      // imports for addCliche
      this.path = this.electronService.remote.require('path');
      this.cp = this.electronService.remote.require('child_process');
      this.cli = this.electronService.remote.require('@deja-vu/cli/dist/utils');
    }
  }

  ngOnDestroy() {
    this.removeAllCliches();
  }

  /**
   * Start the cliche server
   */
  addCliche(cliche: ClicheInstance) {
    if (this.electronService.remote) {
      this.requestProcessor
        .addCliche(cliche.of.name, this.nextPort, cliche.name);
      const serverPath = this.path.join(this.path.dirname(
        this.cli.locateClichePackage(cliche.of.name)),
        '..', 'server', 'server.js');
      const configObj = Object.assign({wsPort: this.nextPort}, cliche.config);
      const configStr = JSON.stringify(JSON.stringify(configObj));
      let command = `node ${serverPath} --config ${configStr}`;
      if (cliche.name !== cliche.of.name) {
        command += ` --as ${cliche.name}`;
      }
      this.processes[cliche.name] = this.cp.spawn(command, [], { shell: true });
      this.nextPort += 1;
    }
  }

  /**
   * Stop the cliche server, if one is running
   */
  removeCliche(clicheName: string) {
    const childProcess = this.processes[clicheName];
    if (childProcess) {
      childProcess.kill('SIGINT');
      delete this.processes[clicheName];
    }
    if (this.requestProcessor) {
      this.requestProcessor.removeCliche(clicheName);
    }
  }

  /**
   * User selected a new action to edit
   */
  onActionChanged(openAction: AppActionDefinition) {
    this.openAction = openAction;
  }

  /**
   * Load an app from a save file
   */
  load(appJSON: string) {
    this.zone.run(() => {
      this.removeAllCliches();
      this.app = App.fromJSON(appJSON);
      this.app.cliches.forEach((cliche) => this.addCliche(cliche));
      this.openAction = this.app.homepage;
      this.snackBar.open('Save has been loaded.', 'dismiss', {
        duration: 2500
      });
    });
  }

  /**
   * Stop all cliche backends to avoid port collisions
   */
  private removeAllCliches() {
    this.app.cliches.forEach((c) => {
      this.removeCliche(c.name);
    });
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
        let toRowIdx = parseInt(target['dataset'].index, 10);
        if (toRowIdx === this.openAction.rows.length) {
          toRowIdx = -1;
        }
        const toRow = this.openAction.rows[toRowIdx] || new Row();
        if (source.classList.contains('action-list')) {
          const {
            source: sourceName,
            action: actionName,
            disabled
          } = el['dataset'];
          if (disabled !== 'true') {
            action = this.app.newActionInstanceByName(actionName, sourceName);
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
}
