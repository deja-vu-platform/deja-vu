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
  AddAppComponentIoComponent,
  DialogData as AddAppComponentIoDialogData
} from '../add-app-component-io/add-app-component-io.component';
import {
  ConfigureComponentComponent,
  DialogData as ConfigureComponentDialogData
} from '../configure-component/configure-component.component';
import { App, AppComponentDefinition, IO } from '../datatypes';


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
  @Input() readonly openComponent: AppComponentDefinition;
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

  onSelectComponent() {
    this.router.navigateByUrl('/' + this.openComponent.name);
  }

  createComponent = () => {
    const data: ConfigureComponentDialogData = {
      app: this.app
    };
    this.dialog.open(ConfigureComponentComponent, {
      width: '50vw',
      data
    });
  }

  editComponent() {
    const data: ConfigureComponentDialogData = {
      app: this.app,
      component: this.openComponent
    };
    this.dialog.open(ConfigureComponentComponent, {
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
      if (!this.electronService.remote) {
        // tmp hack: not show the snackbar on electron because it appears before
        // the file is actually saved
        this.showSnackBar(error ?
          'Save failed.' :
          'Your work has been saved.'
        );
      }
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
    let numFilesToWrite = this.app.components.length + NUM_CONST_FILES;
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

      this.app.components.forEach((component) => {
        const componentRoot = `${path}/src/${component.name}`;
        this.fs.mkdir(componentRoot, (e2) => {
          if (e2 && e2.code !== 'EEXIST') { throw e2; }
          let html = component.toHTML();
          let imageNum = 0;
          html = html.replace(/"data:image\/png;base64,(.*)"/g, (s, data) => {
            imageNum += 1;
            numFilesToWrite += 1;
            const pngFileName = `img-${imageNum}.png`;
            const pngFilePath = `${componentRoot}/${pngFileName}`;
            this.fs.writeFile(pngFilePath, data, 'base64', writeCallback);

            return `"${pngFileName}"`; // relative reference
          });
          const htmlFilePath = `${componentRoot}/${component.name}.html`;
          this.fs.writeFile(htmlFilePath, html, writeCallback);
        });
      });
    });
  }

  open() {
    this.fileInput.nativeElement.click();
  }

  newApp() {
    if (window.confirm(
      'Any unsaved changes in your current app will be lost. ' +
      'Do you wish to continue?')) {
      this.load.emit('{}');
    }
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
    const data: AddAppComponentIoDialogData = {
      component: this.openComponent,
      ioType
    };
    this.dialog.open(AddAppComponentIoComponent, {
      width: '50vw',
      data
    });
  }

  removeIO(io: IO) {
    _.remove(this.openComponent.inputSettings, io);
    _.remove(this.openComponent.outputSettings, io);
  }

  addOutput(output: IO, event: CustomEvent) {
    output.value = event.detail.output;
    // TODO: append once that is actually supported
  }

  ioHintChange(checkedEvt) {
    this.showIoHintChange.emit(checkedEvt.checked);
  }

  isTx(component: AppComponentDefinition): boolean {
    return component.transaction;
  }

  getComponentIcon(component: AppComponentDefinition):
  'home' | 'insert_drive_file' | 'note' {
    if (component.name === this.app.homepage.name) {
      return 'home';
    } else if (this.appPages.has(component.name)) {
      return 'insert_drive_file';
    } else {
      return 'note';
    }
  }

  help() {
    if (this.electronService.remote) {
      this.electronService.shell
        .openExternal(
          'https://github.com/spderosso/deja-vu/blob/master/' +
          'designer/tutorial.md');
    }
  }
}
