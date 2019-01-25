import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  Output,
  ViewChild
} from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ElectronService } from 'ngx-electron';

import {
  ConfigureActionComponent,
  DialogData
} from '../configure-action/configure-action.component';
import { App, AppActionDefinition } from '../datatypes';

const NUM_CONFIG_FILES = 2;
const SNACKBAR_DURATION = 2500;

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent {
  @Input() app: App;
  @Input() openAction: AppActionDefinition;
  @Output() load = new EventEmitter<string>(true); // async
  @Output() changeAction = new EventEmitter<AppActionDefinition>();
  @ViewChild('fileInput') fileInput: ElementRef;
  @ViewChild('downloadAnchor') downloadAnchor: ElementRef;
  fs: any;

  saving = false;
  exporting = false;
  opening = false;

  constructor(
    private _electronService: ElectronService,
    private snackBar: MatSnackBar,
    private zone: NgZone,
    private dialog: MatDialog
  ) {
    if (this._electronService.remote) {
      this.fs = this._electronService.remote.require('fs');
    }
  }

  onSelectAction() {
    this.changeAction.emit(this.openAction);
  }

  createAction = () => {
    const data: DialogData = {
      app: this.app
    };
    this.dialog.open(ConfigureActionComponent, {
      width: '50vw',
      data
    });
  }

  editAction() {
    const data: DialogData = {
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

  private makeAppDirectory(callback: (pathToDir: string) => void) {
    this.fs.mkdir('../designer-apps', (e1) => {
      if (e1 && e1.code !== 'EEXIST') { throw e1; }
      const appRoot = `../designer-apps/${this.app.name}`;
      this.fs.mkdir(appRoot, (e2) => {
        if (e2 && e2.code !== 'EEXIST') { throw e2; }
        callback(appRoot);
      });
    });
  }

  save() {
    console.log(this.app);
    this.saving = true;
    const designerSave = JSON.stringify(this.app);
    const saveFn = this.fs ? this.saveElectron : this.saveBrowser;
    saveFn(designerSave, (error) => {
      this.saving = false;
      this.showSnackBar(error ?
        'Save failed.' :
        'Your work has been saved.'
      );
      if (error) { throw error; }
    });
  }

  private saveElectron = (data: string, callback: (error: any) => void) => {
    this.makeAppDirectory((appRoot) => {
      this.fs.writeFile(`${appRoot}/designer-save.json`, data, callback);
    });
  }

  private saveBrowser = (data: string, callback: (error: any) => void) => {
    data = `data:text/json;charset=utf-8,${encodeURIComponent(data)}`;
    const dlAnchorElm = this.downloadAnchor.nativeElement;
    dlAnchorElm.setAttribute('href', data);
    dlAnchorElm.setAttribute('download', 'designer-save.json');
    dlAnchorElm.click();
    callback(null);
  }

  export() {
    this.exporting = true;
    this.makeAppDirectory((appRoot) => {
      const packageJSON = this.app.toPackageJSON();
      let numFilesToWrite = this.app.actions.length + NUM_CONFIG_FILES;
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
      this.fs.writeFile(`${appRoot}/package.json`, packageJSON, writeCallback);
      const configJSON = this.app.toDVConfigJSON();
      this.fs.writeFile(`${appRoot}/dvconfig.json`, configJSON, writeCallback);
      this.app.actions.forEach((action) => {
        const actionRoot = `${appRoot}/${action.name}`;
        this.fs.mkdir(actionRoot, (e1) => {
          if (e1 && e1.code !== 'EEXIST') { throw e1; }
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
    const openFn = this.fs ? this.openElectron : this.openBrowser;
    openFn(file, (error, data) => {
      this.opening = false;
      if (error) {
        this.showSnackBar('Could not open file.');
        throw error;
      }
      this.load.emit(data);
    });
  }

  private openElectron = (
    file: File,
    callback: (error: any, data: string) => void
  ) => {
    this.fs.readFile(file.path, 'utf8', callback);
  }

  private openBrowser = (
    file: File,
    callback: (error: any, data: string) => void
  ) => {
    const reader = new FileReader();
    reader.onloadend = () => callback(null, <string>reader.result);
    reader.readAsText(file);
  }
}
