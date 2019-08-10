import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material';
import { map } from 'rxjs/operators';

import { ElectronService } from 'ngx-electron';

import {
  AfterClosedData,
  ConfigureClicheComponent,
  DialogData
} from '../configure-cliche/configure-cliche.component';
import {
  ComponentDefinition,
  App,
  AppComponentDefinition,
  ClicheInstance
} from '../datatypes';

import * as _ from 'lodash';


@Component({
  selector: 'app-cliche-instances',
  templateUrl: './cliche-instances.component.html',
  styleUrls: ['./cliche-instances.component.scss']
})
export class ClicheInstancesComponent {
  @Input() readonly app: App;
  @Output() readonly clicheAdded = new EventEmitter<ClicheInstance>();
  @Output() readonly clicheRemoved = new EventEmitter<string>();

  constructor(
    private readonly dialog: MatDialog,
    private readonly electronService: ElectronService) {}

  private openConfigureDialog(
    then: (data: AfterClosedData) => void,
    cliche?: ClicheInstance
  ) {
    const data: DialogData = {
      app: this.app,
      cliche
    };
    this.dialog
      .open(ConfigureClicheComponent, {
        width: '50vw',
        data
      })
      .afterClosed()
      .pipe(
        map((result?: AfterClosedData): AfterClosedData =>
          result || { event: 'cancel'}
        )
      )
      .subscribe(then);
  }

  newClicheInstance() {
    this.openConfigureDialog(({ event, cliche }) => {
      if (event === 'create') {
        this.clicheAdded.emit(cliche);
      }
    });
  }

  editClicheInstance(cliche: ClicheInstance) {
    const origName = cliche.name;
    this.openConfigureDialog(({ event, cliche: newCliche }) => {
      if (event === 'update') {
        this.clicheRemoved.emit(origName);
        this.clicheAdded.emit(newCliche);
      } else if (event === 'delete') {
        this.clicheRemoved.emit(origName);
      }
    }, cliche);
  }

  deleteClicheInstance(ci: ClicheInstance) {
    if (window.confirm(
      'Are you sure you want to remove this cliché instance? ' +
      'All of the components of this cliché instance ' +
      'that you are using will be removed as well.'
    )) {
      this.app.deleteClicheInstance(ci);
    }
  }

  docs(ci: ClicheInstance) {
    if (this.electronService.remote) {
      this.electronService.shell
        .openExternal(
          'https://github.com/spderosso/deja-vu/blob/master/packages/' +
          `catalog/${ci.name}/README.md`);
    }
  }
}
