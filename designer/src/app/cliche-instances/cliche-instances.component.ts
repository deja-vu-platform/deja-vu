import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material';
import { map } from 'rxjs/operators';

import {
  AfterClosedData,
  ConfigureClicheComponent,
  DialogData
} from '../configure-cliche/configure-cliche.component';
import {
  ActionDefinition,
  App,
  AppActionDefinition,
  ClicheInstance
} from '../datatypes';


@Component({
  selector: 'app-cliche-instances',
  templateUrl: './cliche-instances.component.html',
  styleUrls: ['./cliche-instances.component.scss']
})
export class ClicheInstancesComponent {
  @Input() readonly app: App;
  @Output() readonly clicheAdded = new EventEmitter<ClicheInstance>();
  @Output() readonly clicheRemoved = new EventEmitter<string>();

  constructor(private readonly dialog: MatDialog) {}

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

  importCliche() {
    this.openConfigureDialog(({ event, cliche }) => {
      if (event === 'create') {
        this.clicheAdded.emit(cliche);
      }
    });
  }

  editCliche(cliche: ClicheInstance) {
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
}
