import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material';
import * as _ from 'lodash';

import { App, AppActionDefinition } from '../datatypes';

interface ControlGroup {
  form: { valid: boolean };
}

export interface DialogData {
  app: App;
  action?: AppActionDefinition;
}

type ioType = 'Input' | 'Output';

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

  readonly ioTypes: ioType[] = ['Input', 'Output']; // fixed, not state
  readonly currentIO = { Input: <string[]>[], Output: <string[]>[] };
  readonly newIO = { Input: '', Output: '' };
  readonly stagedAdds = { Input: <string[]>[], Output: <string[]>[] };
  readonly stagedRemoves: string[] = [];

  constructor(
    public readonly dialogRef: MatDialogRef<ConfigureActionComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogData
  ) { }

  ngOnInit() {
    if (this.data.action) {
      this.name = this.data.action.name;
      this.page = this.actionIsPage();
      this.home = this.data.app.homepage === this.data.action;
      this.transaction = this.data.action.transaction;
      this.data.action.inputs.forEach((input) => {
        this.currentIO.Input.push(input);
      });
      this.data.action.outputs.forEach((output) => {
        this.currentIO.Output.push(output);
      });
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

    this.ioTypes.forEach((io) => {
      const before: string[] = action[io.toLowerCase() + 's'];
      const after = this.currentIO[io];
      // remove all io not in form state from action state
      _.remove(before, (ioName) => after.indexOf(ioName) === -1);
      // add all io in form state but not action state
      after.forEach((ioName) => {
        if (before.indexOf(ioName) === -1) {
          before.push(ioName);
        }
      });
    });

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

  removeIO(io: ioType, ioName: string) {
    _.remove(this.currentIO[io], (s) => s === ioName);
  }

  addIO(io: ioType) {
    this.currentIO[io].push(this.newIO[io]);
    this.newIO[io] = '';
  }

}
