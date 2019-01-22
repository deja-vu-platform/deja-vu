import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material';
import * as _ from 'lodash';

import { ActionDefinition, App, AppActionDefinition } from '../datatypes';

interface ControlGroup {
  form: { valid: boolean };
}

export interface DialogData {
  app: App;
  action?: ActionDefinition;
}

@Component({
  selector: 'app-configure-action',
  templateUrl: './configure-action.component.html',
  styleUrls: ['./configure-action.component.scss']
})
export class ConfigureActionComponent implements OnInit {
  name: string;

  constructor(
    public dialogRef: MatDialogRef<ConfigureActionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  ngOnInit() {
    if (this.data.action) {
      this.name = this.data.action.name;
    }
  }

  validate(form: ControlGroup) {
    return form.form.valid;
  }

  cancel() {
    this.dialogRef.close();
  }

  delete() {
    this.data.app.actions.forEach((ad) => {
      ad.rows.forEach((r) => {
        _.remove(r.actions, (ai) => (
          ai.of === this.data.action
          && ai.from === this.data.app
        ));
      });
    });
    _.remove(this.data.app.actions, (ad) => ad === this.data.action);
  }

  save() {
    if (this.data.action) {
      this.data.action.name = this.name;
    } else {
      this.data.app.actions.push(new AppActionDefinition(this.name));
    }
    this.dialogRef.close();
  }

}
