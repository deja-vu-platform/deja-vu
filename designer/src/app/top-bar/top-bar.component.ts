import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { ElectronService } from 'ngx-electron';

import { App } from '../datatypes';

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

  constructor(private _electronService: ElectronService) {
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

  save() {
    this.makeAppDirectory((appRoot) => {
      const designerSave = JSON.stringify(this.app);
      this.fs.writeFile(`${appRoot}/designer-save.json`, designerSave, (e) => {
        if (e) { throw e; }
      });
    });
  }

  export() {
    this.makeAppDirectory((appRoot) => {
      const packageJSON = this.app.toPackageJSON();
      this.fs.writeFile(`${appRoot}/package.json`, packageJSON, (e1) => {
        if (e1) { throw e1; }
      });
      const dVConfigJSON = this.app.toDVConfigJSON();
      this.fs.writeFile(`${appRoot}/dvconfig.json`, dVConfigJSON, (e1) => {
        if (e1) { throw e1; }
      });
      this.app.actions.forEach((action) => {
        const actionRoot = `${appRoot}/${action.name}`;
        this.fs.mkdir(actionRoot, (e1) => {
          if (e1 && e1.code !== 'EEXIST') { throw e1; }
          let html = action.toHTML();
          let imageNum = 0;
          html = html.replace(/"data:image\/png;base64,(.*)"/g, (s, data) => {
            imageNum += 1;
            const pngFileName = `img-${imageNum}.png`;
            const pngFilePath = `${actionRoot}/${pngFileName}`;
            this.fs.writeFile(pngFilePath, data, 'base64', (e2) => {
              if (e2) { throw e2; }
            });

            return `"${pngFileName}"`; // relative reference
          });
          const htmlFilePath = `${actionRoot}/${action.name}.html`;
          this.fs.writeFile(htmlFilePath, html, (e2) => {
            if (e2) { throw e2; }
          });
        });
      });
    });
  }

  open() {
    this.fileInput.nativeElement.click();
  }

  onUpload(fileInput) {
    this.fs.readFile(fileInput.target.files[0].path, 'utf8', (e, data) => {
      if (e) { throw e; }
      this.load.emit(data);
    });
  }
}
