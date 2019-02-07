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
}

@Component({
  selector: 'app-input-action',
  templateUrl: './input-action.component.html',
  styleUrls: ['./input-action.component.scss']
})
export class InputActionComponent {
  actionDefinition: ActionDefinition;
  actionInstance: ActionInstance;

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogData
  ) {}

  onSelectAction(actionCollection: ActionCollection) {
    this.actionInstance = new ActionInstance(
      this.actionDefinition,
      actionCollection
    );
  }

}
