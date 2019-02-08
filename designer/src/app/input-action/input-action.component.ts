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
  selection: [ActionDefinition, ActionCollection];
  actionInstance: ActionInstance;

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogData
  ) {}

  onSelectAction() {
    const [actionDefinition, actionCollection] = this.selection;
    this.actionInstance = actionDefinition && actionCollection
      ? new ActionInstance(actionDefinition, actionCollection)
      : undefined;
  }

}
