import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material';
import * as _ from 'lodash';

import {
  App,
  AppActionDefinition,
  AppActionStyles,
  defaultAppActionStyles
} from '../datatypes';

interface ControlGroup {
  form: { valid: boolean };
}

export interface DialogData {
  app: App;
  action?: AppActionDefinition;
}

@Component({
  selector: 'app-configure-action',
  templateUrl: './configure-action.component.html',
  styleUrls: ['./configure-action.component.scss']
})
export class ConfigureActionComponent implements OnInit {
  name: string;
  page: boolean;
  home: boolean;
  transaction: boolean;
  styles: AppActionStyles = defaultAppActionStyles;

  constructor(
    private readonly dialogRef: MatDialogRef<ConfigureActionComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogData
  ) { }

  ngOnInit() {
    if (this.data.action) {
      this.name = this.data.action.name;
      this.styles = _.cloneDeep(this.data.action.styles);
      this.page = this.actionIsPage();
      this.home = this.data.app.homepage === this.data.action;
      this.transaction = this.data.action.transaction;
    }
  }

  actionIsPage(action?: AppActionDefinition): boolean {
    action = action ? action : this.data.action;

    return this.data.app.pages.includes(action);
  }

  makeActionPage(action?: AppActionDefinition) {
    action = action ? action : this.data.action;
    if (!this.actionIsPage(action)) {
      this.data.app.pages.push(action);
    }
  }

  makeActionNotPage(action?: AppActionDefinition) {
    action = action ? action : this.data.action;
    _.remove(this.data.app.pages, (p) => p === action);
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
    this.dialogRef.close();
  }

  save() {
    let action: AppActionDefinition;

    if (this.data.action) {
      action = this.data.action;
      action.name = this.name;
    } else {
      action = new AppActionDefinition(this.name);
      const insertIdx = _.sortedIndexBy(this.data.app.actions, action, 'name');
      this.data.app.actions.splice(insertIdx, 0, action);
    }

    if (this.page) {
      this.makeActionPage(action);
    } else {
      this.makeActionNotPage(action);
    }

    action.transaction = this.transaction;

    Object.assign(action.styles, this.styles);

    this.dialogRef.close();
  }

  makeHomepage() {
    this.makeActionPage();
    this.data.app.homepage = this.data.action;
  }

  /**
   * you can delete the action
   * as long as it is not the only action
   * or the homepage
   */
  get canDelete() {
    return (
      this.data.app.actions.length > 1
      && this.data.app.homepage !== this.data.action
    );
  }

}
