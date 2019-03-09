import { Component, Input, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material';
import * as _ from 'lodash';
import * as uuidv4 from 'uuid/v4';

import { ActionInstance, App, AppActionDefinition } from '../datatypes';
import {
  DialogData as InputActionDialogData,
  InputActionComponent
} from '../input-action/input-action.component';
import {
  DialogData as TextDialogData,
  TextComponent
} from '../text/text.component';

@Component({
  selector: 'app-set-inputs',
  templateUrl: './set-inputs.component.html',
  styleUrls: ['./set-inputs.component.scss']
})
export class SetInputsComponent implements OnChanges {
  @Input() app: App;
  @Input() actionInstance: ActionInstance;
  @Input() openAction: AppActionDefinition;

  expressionInputs: string[];
  actionInputs: string[];

  constructor(private readonly dialog: MatDialog) { }

  ngOnChanges() {
    // separate out expression and action inputs
    const [actionInputs, expressionInputs] = _.partition(
      this.actionInstance.of.inputs,
      (name) => name in this.actionInstance.of.actionInputs
    );
    // get the names
    this.expressionInputs = expressionInputs;
    this.actionInputs = actionInputs;
  }

  /**
   * Open the menu for passing in an action
   */
  inputAction(inputName: string) {
    // arguments
    const data: InputActionDialogData = {
      app: this.app,
      currentValue: <ActionInstance>this
        .actionInstance.inputSettings[inputName],
      openAction: this.openAction
    };
    // open the menu
    const dialogRef = this.dialog.open(InputActionComponent, {
      width: '50vw',
      data
    });
    // update the input setting
    dialogRef.afterClosed()
      .subscribe(() => {
        this.actionInstance.inputSettings[inputName] =
          dialogRef.componentInstance.actionInstance;
      });
  }

  openTextEditor() {
    const data: TextDialogData = {
      actionInstance: this.actionInstance,
      readOnly: false
    };
    this.dialog.open(TextComponent, {
      width: '50vw',
      data
    });
  }
}
