import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material';

import {
  AfterClosedData,
  ConfigureClicheComponent,
  DialogData
} from '../configure-cliche/configure-cliche.component';
import {
  App,
  AppActionDefinition,
  ClicheInstance
} from '../datatypes';


@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent {
  @Input() readonly app: App;
  @Input() readonly openAction: AppActionDefinition;
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
