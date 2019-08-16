import {
  Component,
  EventEmitter,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit
} from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { NavigationStart, Router } from '@angular/router';
import * as _ from 'lodash';
import { DragulaService } from 'ng2-dragula';
import { ElectronService } from 'ngx-electron';

import {
  App,
  AppComponentDefinition,
  ComponentInstance,
  ConceptInstance,
  Row
} from '../datatypes';


@Component({
  selector: 'designer-root',
  templateUrl: './designer.component.html',
  styleUrls: ['./designer.component.scss'],
  viewProviders: [DragulaService]
})
export class DesignerComponent implements OnInit, OnDestroy {
  app = new App('myapp');
  openComponentInstance: ComponentInstance;
  previewMode = false;
  dragging = false;
  showIoHints = false;

  private _openComponent: AppComponentDefinition;
  private nextPort = 3002;
  private readonly processes: {[n: string]: { kill: (s: string) => void }} = {};
  private readonly requestProcessor: any; // dv-gateway.DesignerRequestProcessor
  private readonly assetsDir: string;
  private readonly path: any; // path module
  private readonly cp: any; // child_process module
  private readonly cli: any; // dv-cli module
  private readonly fsExtra: any; // fsExtra module

  constructor(
    private readonly dragulaService: DragulaService,
    private readonly zone: NgZone,
    private readonly snackBar: MatSnackBar,
    private readonly electronService: ElectronService,
    private readonly router: Router
  ) {
    this.openComponent = this.app.homepage;
    window['dv-designer'] = true; // alters how concept server finds components
    this.configureDragula(); // dragula needs to be configured at the top level
    this.dragulaService.drag()
      .subscribe(() => {
        this.dragging = true;
      });
    this.dragulaService.dragend()
      .subscribe(() => {
        this.dragging = false;
      });

    // imports for addConcept
    if (this.electronService.remote) {
      this.requestProcessor = this.electronService.remote
        .require('./electron.js').requestProcessor;
      this.assetsDir = this.electronService.remote
        .require('./electron.js').assetsDir;
      this.path = this.electronService.remote.require('path');
      this.cp = this.electronService.remote.require('child_process');
      this.cli = this.electronService.remote.require('@deja-vu/cli/dist/utils');
      this.fsExtra = this.electronService.remote.require('fs-extra');
    }
  }

  get openComponent(): AppComponentDefinition {
    return this._openComponent;
  }

  set openComponent(component: AppComponentDefinition) {
    this._openComponent = component;
    this.openComponentInstance = new ComponentInstance(component, this.app);
  }

  ngOnInit() {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        const [name] = (e.url.startsWith('/') ? e.url.slice(1) : e.url)
          .split(';');
        if (name === '') {
          this.openComponent = this.app.homepage;
        } else {
          const openComponent = this.app.components
            .find((a) => a.name === name);
          if (openComponent) {
            this.openComponent = openComponent;
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
    this.router.navigateByUrl('');
  }

  ngOnDestroy() {
    this.removeAllConcepts();
  }

  /**
   * Start the concept server
   */
  addConcept(concept: ConceptInstance) {
    if (this.electronService.remote) {
      this.requestProcessor
        .addConcept(concept.of.name, this.nextPort, concept.name);
      const conceptPkg = this.path.join(this.path.dirname(
        this.cli.locateConceptPackage(concept.of.name)), '..');
      const serverPath = this.path.join(conceptPkg, 'server', 'server.js');
      const configObj = Object
        .assign({ wsPort: this.nextPort }, concept.config);
      const configStr = JSON.stringify(JSON.stringify(configObj));
      let command = `node ${serverPath} --config ${configStr}`;
      if (concept.name !== concept.of.name) {
        command += ` --as ${concept.name}`;
      }
      this.processes[concept.name] = this
        .cp.spawn(command, [], { shell: true });
      this.nextPort += 1;

      // We also need to copy assets to the assets folder
      const conceptAssetsPath = this.path.join(conceptPkg, 'assets');
      // rating hack: see ng-ap-builder.ts in the compiler package
      const appAssetsDir = concept.of.name === 'rating' ? this.assetsDir :
        this.path.join(this.assetsDir, concept.of.name);
      if (this.fsExtra.existsSync(conceptAssetsPath)) {
        this.fsExtra.copySync(conceptAssetsPath, appAssetsDir);
      }
    }
  }

  /**
   * Stop the concept server, if one is running
   */
  removeConcept(conceptName: string) {
    const childProcess = this.processes[conceptName];
    if (childProcess) {
      childProcess.kill('SIGINT');
      delete this.processes[conceptName];
    }
    if (this.requestProcessor) {
      this.requestProcessor.removeConcept(conceptName);
    }
  }

  /**
   * Load an app from a save file
   */
  load(appJSON: string) {
    this.zone.run(() => {
      this.removeAllConcepts();
      this.app = App.fromJSON(appJSON);
      this.app.concepts.forEach((concept) => this.addConcept(concept));
      this.openComponent = this.app.homepage;
      this.snackBar.open('App has been loaded.', 'dismiss', {
        duration: 2500
      });
    });
  }

  /**
   * Stop all concept backends to avoid port collisions
   */
  private removeAllConcepts() {
    this.app.concepts.forEach((c) => {
      this.removeConcept(c.name);
    });
  }

  /**
   * Must run in constructor
   */
  private configureDragula() {
    // drag components on the page to add them
    // drag them between rows to move them
    this.dragulaService.createGroup('component', {
      moves: (el, source) => source.classList.contains('component-list')
        || source.classList.contains('dvd-row'),
      // we use copy to prevent depletion of the component list
      copy: (el, source) => source.classList.contains('component-list'),
      accepts: (el, target, source) => target.classList.contains('dvd-row')
        || (
          target.classList.contains('component-input')
          && source.classList.contains('component-list')
        )
    });

    // this function is unfortunately kind of complicated
    // because you cannot put two dragula groups on one element
    this.dragulaService.drop('component')
      .subscribe(({ el, source, target, sibling }) => {
        // usually we want to get rid of the copy that dragula creates
        // however in some circumstances angular does not create a new elm
        // so we need to keep the copy
        let shouldRemoveCopy = true;

        if (target.classList.contains('dvd-row')) {
          // use case 1: instantiating a component by dragging it into a row
          // find target row (-1 means new last row)
          let toRowIdx = parseInt(target['dataset'].index, 10);
          if (toRowIdx === this.openComponent.rows.length) {
            toRowIdx = -1;
          }
          // find target index within row (-1 means last)
          let newComponentIndex = sibling
            ? parseInt(sibling['dataset'].index, 10)
            : -1;
          // find source component
          let component: ComponentInstance;
          if (source.classList.contains('component-list')) {
            // case 1: dragging in a new component
            const {
              source: sourceName,
              component: componentName,
              disabled
            } = el['dataset'];
            if (disabled !== 'true') {
              component = this.app
                .newComponentInstanceByName(componentName, sourceName);
            }
          } else if (source.classList.contains('dvd-row')) {
            // case 2: moving a component
            const fromRowIdx = parseInt(source['dataset'].index, 10);
            const componentIdx = parseInt(el['dataset'].index, 10);
            [component] = this.openComponent.rows[fromRowIdx].components
              .splice(componentIdx, 1);
            if (fromRowIdx === toRowIdx) {
              // this is when ng does not generate a new element
              if (componentIdx < newComponentIndex ||
                newComponentIndex === -1) {
                shouldRemoveCopy = false;
              }
              // account for chaning the index of the sibling
              // we want to insert in front of
              if (componentIdx < newComponentIndex) {
                newComponentIndex -= 1;
              }
            }
          }

          if (component) {
            const toRow = this.openComponent.rows[toRowIdx] || new Row();
            if (newComponentIndex >= 0) {
              toRow.components.splice(newComponentIndex, 0, component);
            } else {
              toRow.components.push(component);
            }
            if (toRowIdx === -1) {
              this.openComponent.rows.push(toRow);
            }
          }
        } else if (
          target.classList.contains('component-input')
          && source.classList.contains('component-list')
        ) {
          // use case 2: passing a component to an input
          const {
            source: sourceName,
            component: componentName,
            disabled
          } = el['dataset'];
          if (disabled !== 'true') {
            target.dispatchEvent(new CustomEvent('inputComponent', {
              detail: { sourceName, componentName }
            }));
          }
        } else {
          // do nothing when dragging a component from the page to an input
          shouldRemoveCopy = false;
        }
        if (shouldRemoveCopy) {
          el.parentNode.removeChild(el); // delete copy that Dragula leaves
        }
      });

    // drag away an inputted component to remove it
    this.dragulaService.createGroup('inputted-component', {
      moves: (el) => el.classList.contains('inputted-component'),
      removeOnSpill: true
    });
    this.dragulaService.remove('inputted-component')
      .subscribe(({ source }) => {
        source.dispatchEvent(new CustomEvent('unInputComponent'));
      });

    // drag an output into an expression input to populate the input
    // with a reference to the output automatically
    this.dragulaService.createGroup('expression-io', {
      moves: (el, source) => source.classList.contains('inputtables')
        && !el.classList.contains('no-drag'),
      copy: (el, source) => source.classList.contains('inputtables')
    });
    this.dragulaService.drop('expression-io')
      .subscribe(({ el, target, source }) => {
        if (
          target
          && target.classList.contains('input-value')
          && !(
            source['dataset'].context
            && source['dataset'].context !== target['dataset'].context
          )
        ) {
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
        const [moveRow] = this.openComponent.rows.splice(fromRowIdx, 1);
        let toRowIdx = sibling ?
          parseInt(sibling['dataset'].index, 10)
          : -1;
        if (fromRowIdx < toRowIdx) {
          toRowIdx -= 1;
        }
        if (toRowIdx >= 0) {
          this.openComponent.rows.splice(toRowIdx, 0, moveRow);
        } else {
          this.openComponent.rows.push(moveRow);
        }
      });
  }

  showPreview() {
    this.snackBar
      .open('Entering preview mode. Press escape to exit.', 'dismiss');
    this.previewMode = true;
  }

  @HostListener('document:keyup', ['$event.key'])
  handleKeyUp(key: string) {
    if (key === 'Escape') {
      this.previewMode = false;
    }
  }

}
