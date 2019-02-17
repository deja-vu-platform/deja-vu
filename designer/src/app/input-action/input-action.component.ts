import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import {
  ActionCollection,
  ActionDefinition,
  ActionInstance,
  App
} from '../datatypes';

// tslint:disable-next-line
export interface DialogData {
  app: App;
  actionInstance: ActionInstance; // existing setting
}

@Component({
  selector: 'app-input-action',
  templateUrl: './input-action.component.html',
  styleUrls: ['./input-action.component.scss']
})
export class InputActionComponent {
  selection = '[]'; // [ActionDefinition, ActionCollection]
  actionInstance: ActionInstance;

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogData
  ) {
    this.actionInstance = data.actionInstance;
    this.selection = this.stringify([
      this.actionInstance.of.name,
      this.actionInstance.from.name
    ]);
  }

  onSelectAction() {
    const [ofName, fromName] =
      JSON.parse(this.selection);
    this.actionInstance =
      this.data.app.newActionInstanceByName(ofName, fromName);
  }

  stringify(data: any): string {
    return JSON.stringify(data);
  }

}
