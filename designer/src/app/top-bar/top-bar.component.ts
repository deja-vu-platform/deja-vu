import { Component, Input } from '@angular/core';
import { ElectronService } from 'ngx-electron';

import { App } from '../datatypes';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent {
  @Input() app: App;
  fs: any;

  constructor(private _electronService: ElectronService) {
    this.fs = this._electronService.remote.require('fs');
  }

  exportApp() {
    this.fs.mkdir('../designer-apps', (e1) => {
      if (e1 && e1.code !== 'EEXIST') { throw e1; }
      const appRoot = `../designer-apps/${this.app.name}`;
      this.fs.mkdir(appRoot, (e2) => {
        const packageJSON = this.app.toPackageJSON();
        this.fs.writeFile(`${appRoot}/package.json`, packageJSON, (e3) => {
          if (e3) { throw e3; }
        });
        const dVConfigJSON = this.app.toDVConfigJSON();
        this.fs.writeFile(`${appRoot}/dvconfig.json`, dVConfigJSON, (e3) => {
          if (e3) { throw e3; }
        });
        this.app.actions.forEach((action) => {
          const actionRoot = `${appRoot}/${action.name}`;
          this.fs.mkdir(actionRoot, (e3) => {
            if (e3 && e3.code !== 'EEXIST') { throw e3; }
            const fileName = `${actionRoot}/${action.name}.html`;
            const html = action.toHTML();
            this.fs.writeFile(fileName, html, (e4) => {
              if (e4) { throw e4; }
            });
          });
        });
      });
    });
  }
}
