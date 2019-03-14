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
  defaultAppActionStyles,
  IO
} from '../datatypes';

interface ControlGroup {
  form: { valid: boolean };
}

export interface DialogData {
  app: App;
  action?: AppActionDefinition;
}

type IOType = 'Input' | 'Output';

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

  readonly ioTypes: IOType[] = ['Input', 'Output']; // fixed, not state
  readonly currentIO = { Input: <IO[]>[], Output: <IO[]>[] };

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
      this.ioTypes.forEach((ioType) => {
        this.data.action[`${ioType.toLowerCase()}Settings`].forEach((io) => {
          this.currentIO[ioType].push(Object.assign({}, io));
        });
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

    this.ioTypes.forEach((ioType) => {
      const before: IO[] = action[ioType.toLowerCase() + 'Settings'];
      const after = this.currentIO[ioType];
      // remove all io not in form state from action state
      _.remove(before, (beforeIO) =>
        after.find((afterIO) => afterIO.name === beforeIO.name)
      );
      // add all io in form state but not action state
      after.forEach((afterIO) => {
        if (!before.find((beforeIO) => beforeIO.name === afterIO.name)) {
          before.push(afterIO);
        }
      });
    });

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

  removeIO(ioType: IOType, index: number) {
    this.currentIO[ioType].splice(index, 1);
  }

  addIO(ioType: IOType) {
    this.currentIO[ioType].push({name: '', value: '' });
  }

}
