import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { NavigationStart, Router } from '@angular/router';
import * as _ from 'lodash';
import { DragulaService } from 'ng2-dragula';
import { ElectronService } from 'ngx-electron';

import {
  ActionInstance,
  App,
  ClicheInstance,
  Row
} from '../datatypes';


@Component({
  selector: 'designer-root',
  templateUrl: './designer.component.html',
  styleUrls: ['./designer.component.scss'],
  viewProviders: [DragulaService]
})
export class DesignerComponent implements OnInit, OnDestroy {
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
    private readonly electronService: ElectronService,
    private readonly router: Router
  ) {
    window['dv-designer'] = true; // alters how cliche server finds actions
    this.configureDragula(); // dragula needs to be configured at the top level

    // imports for addCliche
    if (this.electronService.remote) {
      this.requestProcessor = this.electronService.remote
        .require('./electron.js').requestProcessor;
      this.path = this.electronService.remote.require('path');
      this.cp = this.electronService.remote.require('child_process');
      this.cli = this.electronService.remote.require('@deja-vu/cli/dist/utils');
    }
  }

  ngOnInit() {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        const name = e.url.slice(1);
        if (name === '') {
          this.openAction = this.app.homepage;
        } else {
          const openAction = this.app.actions.find((a) => a.name === name);
          if (openAction) {
            this.openAction = openAction;
          } else if (!this.router.navigated) {
            this.router.navigateByUrl('');
          } else {
            this.snackBar
              .open('Page Not Found', 'Go Home')
              .afterDismissed()
              .subscribe(() => this.router.navigateByUrl(''));
          }
        }
      }
    });
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
    // drag actions on the page to add them
    // drag them between rows to move them
    this.dragulaService.createGroup('action', {
      moves: (el, source) => source.classList.contains('action-list')
        || source.classList.contains('dvd-row'),
      // we use copy to prevent depletion of the action list
      copy: (el, source) => source.classList.contains('action-list'),
      accepts: (el, target, source) => target.classList.contains('dvd-row')
        || (
          target.classList.contains('action-input')
          && source.classList.contains('action-list')
        ),
      // if you drag outside of a row the action gets removed
      removeOnSpill: true
    });

    // this function is unfortunately kind of complicated
    // because you cannot put two dragula groups on one element
    this.dragulaService.drop('action')
      .subscribe(({ el, source, target, sibling }) => {
        // usually we want to get rid of the copy that dragula creates
        // however in some circumstances angular does not create a new elm
        // so we need to keep the copy
        let shouldRemoveCopy = true;

        if (target.classList.contains('dvd-row')) {
          // use case 1: instantiating an action by dragging it into a row
          // find target row (-1 means new last row)
          let toRowIdx = parseInt(target['dataset'].index, 10);
          if (toRowIdx === this.openAction.rows.length) {
            toRowIdx = -1;
          }
          // find target index within row (-1 means last)
          let newActionIndex = sibling
            ? parseInt(sibling['dataset'].index, 10)
            : -1;
          // find source action
          let action: ActionInstance;
          if (source.classList.contains('action-list')) {
            // case 1: dragging in a new action
            const {
              source: sourceName,
              action: actionName,
              disabled
            } = el['dataset'];
            if (disabled !== 'true') {
              action = this.app.newActionInstanceByName(actionName, sourceName);
            }
          } else if (source.classList.contains('dvd-row')) {
            // case 2: moving an action
            const fromRowIdx = parseInt(source['dataset'].index, 10);
            const actionIdx = parseInt(el['dataset'].index, 10);
            [action] = this.openAction.rows[fromRowIdx].actions
              .splice(actionIdx, 1);
            if (fromRowIdx === toRowIdx) {
              // this is when ng does not generate a new element
              if (actionIdx < newActionIndex || newActionIndex === -1) {
                shouldRemoveCopy = false;
              }
              // account for chaning the index of the sibling
              // we want to insert in front of
              if (actionIdx < newActionIndex) {
                newActionIndex -= 1;
              }
            }
          }

          if (action) {
            const toRow = this.openAction.rows[toRowIdx] || new Row();
            if (newActionIndex >= 0) {
              toRow.actions.splice(newActionIndex, 0, action);
            } else {
              toRow.actions.push(action);
            }
            if (toRowIdx === -1) {
              this.openAction.rows.push(toRow);
            }
          }
        } else if (
          target.classList.contains('action-input')
          && source.classList.contains('action-list')
        ) {
          // use case 2: passing an action to an input
          const {
            source: sourceName,
            action: actionName,
            disabled
          } = el['dataset'];
          if (disabled !== 'true') {
            target.dispatchEvent(new CustomEvent('inputAction', {
              detail: { sourceName, actionName }
            }));
          }
        } else {
          // do nothing when dragging an action from the page to an input
          shouldRemoveCopy = false;
        }
        if (shouldRemoveCopy) {
          el.parentNode.removeChild(el); // delete copy that Dragula leaves
        }
      });

    // handle dropping an action outside the page (remove it)
    this.dragulaService.remove('action')
      .subscribe(({ el, source }) => {
        if (source.classList.contains('dvd-row')) {
          const fromRowIdx = parseInt(source['dataset'].index, 10);
          const actionIdx = parseInt(el['dataset'].index, 10);
          this.openAction.rows[fromRowIdx].actions.splice(actionIdx, 1);
        }
      });

    // drag away an inputted action to remove it
    this.dragulaService.createGroup('inputted-action', {
      moves: (el) => el.classList.contains('inputted-action'),
      removeOnSpill: true
    });
    this.dragulaService.remove('inputted-action')
      .subscribe(({ source }) => {
        source.dispatchEvent(new CustomEvent('unInputAction'));
      });

    // drag an output into an expression input to populate the input
    // with a reference to the output automatically
    this.dragulaService.createGroup('expression-io', {
      moves: (el, source) => source.classList.contains('inputtables')
        && !el.classList.contains('no-drag'),
      copy: (el, source) => source.classList.contains('inputtables')
    });
    this.dragulaService.drop('expression-io')
      .subscribe(({ el, target }) => {
        if (target && target.classList.contains('input-value')) {
          target.dispatchEvent(new CustomEvent('addOutput', {
            detail: { output: el['dataset'].output }
          }));
        }
    });

    // drag rows to reorder them
    this.dragulaService.createGroup('row', {
      moves: (el, source, handle) => handle.classList.contains('handle')
        && source.lastChild !== el
    });
    this.dragulaService.drop('row')
      .subscribe(({ el, sibling }) => {
        const fromRowIdx = parseInt(el['dataset'].index, 10);
        const [moveRow] = this.openAction.rows.splice(fromRowIdx, 1);
        let toRowIdx = sibling ?
          parseInt(sibling['dataset'].index, 10)
          : -1;
        if (fromRowIdx < toRowIdx) {
          toRowIdx -= 1;
        }
        if (toRowIdx >= 0) {
          this.openAction.rows.splice(toRowIdx, 0, moveRow);
        } else {
          this.openAction.rows.push(moveRow);
        }
      });
  }
}
