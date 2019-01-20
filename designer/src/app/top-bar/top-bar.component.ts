import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  Output,
  ViewChild
} from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ElectronService } from 'ngx-electron';

import { App } from '../datatypes';

const NUM_CONFIG_FILES = 2;
const SNACKBAR_DURATION = 2500;

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent {
  @Input() app: App;
  @Output() load = new EventEmitter<string>();
  @ViewChild('fileInput') fileInput: ElementRef;
  fs: any;

  saving = false;
  exporting = false;
  opening = false;

  constructor(
    private _electronService: ElectronService,
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) {
    this.fs = this._electronService.remote.require('fs');
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

  private showSnackBar(message: string) {
    this.zone.run(() => {
      this.snackBar.open(message, 'dismiss', {
        duration: SNACKBAR_DURATION
      });
    });
  }

  save() {
    this.saving = true;
    this.makeAppDirectory((appRoot) => {
      const designerSave = JSON.stringify(this.app);
      this.fs.writeFile(`${appRoot}/designer-save.json`, designerSave, (e) => {
        this.saving = false;
        this.showSnackBar(e ?
          'Save failed.' :
          'Your work has been saved.'
        );
        if (e) { throw e; }
      });
    });
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
          const message = exportError ?
            'Export failed.' :
            'Your app has been exported.';
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
    this.fs.readFile(fileInput.target.files[0].path, 'utf8', (e, data) => {
      this.opening = false;
      if (e) {
        this.showSnackBar('Could not open file.');
        throw e;
      }
      this.load.emit(data);
    });
  }
}
