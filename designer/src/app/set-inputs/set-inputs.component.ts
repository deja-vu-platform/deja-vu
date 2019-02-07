import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material';

import { ActionInstance, App } from '../datatypes';
import {
  DialogData,
  InputActionComponent
} from '../input-action/input-action.component';

@Component({
  selector: 'app-set-inputs',
  templateUrl: './set-inputs.component.html',
  styleUrls: ['./set-inputs.component.scss']
})
export class SetInputsComponent {
  @Input() app: App;
  @Input() actionInstance: ActionInstance;

  constructor(private readonly dialog: MatDialog) { }

  inputAction() {
    const data: DialogData = {
      app: this.app
    };
    this.dialog.open(InputActionComponent, {
      width: '50vw',
      data
    });
  }


}
