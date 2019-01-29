import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material';

import { dvCliche } from '../cliche.module';
import {
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
export class SideMenuComponent implements OnInit {
  @Input() app: App;
  @Input() openAction: AppActionDefinition;
  @Output() clicheAdded = new EventEmitter<ClicheInstance>();
  @Output() clicheRemoved = new EventEmitter<string>();
  // need consistent object to return
  private _actionCollections: ActionCollection[];

  constructor(private dialog: MatDialog) {}

  ngOnInit() {
    this._actionCollections = [dvCliche];
  }

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

  importCliche() {
    const data: DialogData = {
      app: this.app
    };
    this.dialog
      .open(ConfigureClicheComponent, {
        width: '50vw',
        data
      })
      .afterClosed()
      .subscribe(({ event, cliche }) => {
        if (event === 'create') {
          this.clicheAdded.emit(cliche);
        }
      });
  }

  editCliche(cliche: ClicheInstance) {
    const origName = cliche.name;
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
      .subscribe(({ event, cliche: newCliche }) => {
        if (event === 'update' || event === 'delete') {
          this.clicheRemoved.emit(origName);
        }
        if (event === 'update') {
          this.clicheAdded.emit(newCliche);
        }
      });
  }
}
