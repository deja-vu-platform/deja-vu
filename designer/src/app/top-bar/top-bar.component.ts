import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  Output,
  ViewChild
} from '@angular/core';
import {
  MatDialog,
  MatMenuTrigger,
  MatSnackBar,
  MatTabGroup
} from '@angular/material';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { ElectronService } from 'ngx-electron';

import {
  AddAppActionIoComponent,
  DialogData as AddAppActionIoDialogData
} from '../add-app-action-io/add-app-action-io.component';
import {
  ConfigureActionComponent,
  DialogData as ConfigureActionDialogData
} from '../configure-action/configure-action.component';
import { App, AppActionDefinition, IO } from '../datatypes';


const NUM_CONST_FILES = 3;
const SNACKBAR_DURATION = 2500;

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent {
  private _app: App;
  private appPages;
  @Input()
  set app(app: App) {
    this._app = app;
    this.appPages = new Set<string>(_.map(this.app.pages, 'name'));
  }
  get app(): App {
    return this._app;
  }
  @Input() readonly openAction: AppActionDefinition;
  @Output() readonly load = new EventEmitter<string>(true); // async
  @Output() readonly preview = new EventEmitter<void>();
  @Output() readonly showIoHintChange = new EventEmitter<boolean>();
  @ViewChild('fileInput') readonly fileInput: ElementRef;
  @ViewChild('directoryInput') readonly directoryInput: ElementRef;
  @ViewChild('downloadAnchor') readonly downloadAnchor: ElementRef;
  readonly fs: any;
  selectedIndex = 0;

  saving = false;
  exporting = false;
  opening = false;


  constructor(
    private readonly electronService: ElectronService,
    private readonly snackBar: MatSnackBar,
    private readonly zone: NgZone,
    private readonly dialog: MatDialog,
    private readonly router: Router
  ) {
    if (this.electronService.remote) {
      this.fs = this.electronService.remote.require('fs');
    }
  }

  showPreview() {
    this.preview.emit();
  }

  onSelectAction() {
    this.router.navigateByUrl('/' + this.openAction.name);
  }

  createAction = () => {
    const data: ConfigureActionDialogData = {
      app: this.app
    };
    this.dialog.open(ConfigureActionComponent, {
      width: '50vw',
      data
    });
  }

  editAction() {
    const data: ConfigureActionDialogData = {
      app: this.app,
      action: this.openAction
    };
    this.dialog.open(ConfigureActionComponent, {
      width: '50vw',
      data
    });
  }

  private showSnackBar(message: string) {
    this.zone.run(() => {
      this.snackBar.open(message, 'dismiss', {
        duration: SNACKBAR_DURATION
      });
    });
  }

  save() {
    this.saving = true;
    const designerSave = JSON.stringify(this.app, null, 2);
    this.saveBrowser(designerSave, (error) => {
      this.saving = false;
      this.showSnackBar(error ?
        'Save failed.' :
        'Your work has been saved.'
      );
      if (error) { throw error; }
    });
  }

  private saveBrowser(data: string, callback: (error: any) => void): void {
    data = `data:text/json;charset=utf-8,${encodeURIComponent(data)}`;
    const dlAnchorElm = this.downloadAnchor.nativeElement;
    dlAnchorElm.setAttribute('href', data);
    dlAnchorElm.setAttribute('download', 'designer-save.json');
    dlAnchorElm.click();
    callback(null);
  }

  export() {
    this.directoryInput.nativeElement.click();
  }

  onSelectExportDir(event) {
    const { path } = event.target.files[0];
    this.exporting = true;
    // count callbacks (since fs isn't promise-based)
    let numFilesToWrite = this.app.actions.length + NUM_CONST_FILES;
    let numFilesWritten = 0;
    let exportError = false;
    const writeCallback = (e) => {
      numFilesWritten += 1;
      if (e) {
        exportError = true;
        throw e;
      }
      if (numFilesWritten === numFilesToWrite) {
        this.exporting = false;
        this.showSnackBar(exportError ?
          'Export failed.' :
          'Your app has been exported.'
        );
      }
    };

    const packageJSON = this.app.toPackageJSON();
    this.fs.writeFile(`${path}/package.json`, packageJSON, writeCallback);
    const configJSON = this.app.toDVConfigJSON();
    this.fs.writeFile(`${path}/dvconfig.json`, configJSON, writeCallback);

    this.fs.mkdir(`${path}/src`, (e1) => {
      if (e1 && e1.code !== 'EEXIST') { throw e1; }
      const css = this.app.toCSS();
      this.fs.writeFile(`${path}/src/styles.css`, css, writeCallback);

      this.app.actions.forEach((action) => {
        const actionRoot = `${path}/src/${action.name}`;
        this.fs.mkdir(actionRoot, (e2) => {
          if (e2 && e2.code !== 'EEXIST') { throw e2; }
          let html = action.toHTML();
          let imageNum = 0;
          html = html.replace(/"data:image\/png;base64,(.*)"/g, (s, data) => {
            imageNum += 1;
            numFilesToWrite += 1;
            const pngFileName = `img-${imageNum}.png`;
            const pngFilePath = `${actionRoot}/${pngFileName}`;
            this.fs.writeFile(pngFilePath, data, 'base64', writeCallback);

            return `"${pngFileName}"`; // relative reference
          });
          const htmlFilePath = `${actionRoot}/${action.name}.html`;
          this.fs.writeFile(htmlFilePath, html, writeCallback);
        });
      });
    });
  }

  open() {
    this.fileInput.nativeElement.click();
  }

  onUpload(fileInput) {
    this.opening = true;
    const file: File = fileInput.target.files[0];
    this.openBrowser(file, (error, data) => {
      this.opening = false;
      if (error) {
        this.showSnackBar('Could not open file.');
        throw error;
      }
      this.load.emit(data);
      // reset file input so that the user can reload the same project
      this.fileInput.nativeElement.value = '';
    });
  }

  private openBrowser(
    file: File,
    callback: (error: any, data: string) => void
  ) {
    const reader = new FileReader();
    reader.onloadend = () => callback(null, <string>reader.result);
    reader.readAsText(file);
  }

  closeMenu(trigger: MatMenuTrigger) {
    trigger.closeMenu();
  }

  clickFirstTab(mtg: MatTabGroup) {
    // the selected tab is not highlighted unless we touch it
    const tabGroupEl: HTMLElement = mtg._elementRef.nativeElement;
    const firstTabEl = tabGroupEl.querySelector('.mat-tab-label');
    firstTabEl.dispatchEvent(new Event('mousedown'));
    // the not-selected tab does not load the first time for some reason
    const numTabs = 2;
    mtg.selectedIndex = (mtg.selectedIndex + 1) % numTabs;
    // selectedIndex seems to be a setter
    // we need to let it resolve before updating again
    setTimeout(() => mtg.selectedIndex = (mtg.selectedIndex + 1) % numTabs);
  }

  addIO(ioType: 'input' | 'output') {
    const data: AddAppActionIoDialogData = {
      action: this.openAction,
      ioType
    };
    this.dialog.open(AddAppActionIoComponent, {
      width: '50vw',
      data
    });
  }

  removeIO(io: IO) {
    _.remove(this.openAction.inputSettings, io);
    _.remove(this.openAction.outputSettings, io);
  }

  addOutput(output: IO, event: CustomEvent) {
    output.value = event.detail.output;
    // TODO: append once that is actually supported
  }

  ioHintChange(checkedEvt) {
    this.showIoHintChange.emit(checkedEvt.checked);
  }

  getActionIcon(action: AppActionDefinition):
  'home' | 'insert_drive_file' | 'note' {
    if (action.name === this.app.homepage.name) {
      return 'home';
    } else if (this.appPages.has(action.name)) {
      return 'insert_drive_file';
    } else {
      return 'note';
    }
  }
}
