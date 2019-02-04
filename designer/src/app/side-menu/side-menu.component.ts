import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material';

import { dvCliche } from '../cliche.module';
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


interface ActionCollection {
  name: string;
  actions: ActionDefinition[];
}


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
  // need consistent object to return
  private readonly _actionCollections: ActionCollection[] = [dvCliche];

  constructor(private readonly dialog: MatDialog) {}

  get actionCollections(): ActionCollection[] {
    this._actionCollections.splice(1);
    this._actionCollections.push(this.app);
    this._actionCollections.push.apply(
      this._actionCollections,
      this.app.cliches
        .sort(({ name: nameA }, { name: nameB }) =>
          nameA === nameB ? 0 : (nameA < nameB ? -1 : 1)
        )
    );

    return this._actionCollections;
  }

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
