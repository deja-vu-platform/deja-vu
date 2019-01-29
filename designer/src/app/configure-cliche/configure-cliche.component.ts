import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import {
  ErrorStateMatcher,
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatSelectChange
} from '@angular/material';
import * as _ from 'lodash';

import { clicheDefinitions } from '../cliche.module';
import { App, ClicheDefinition, ClicheInstance } from '../datatypes';


export interface DialogData {
  app: App;
  cliche?: ClicheInstance;
}

interface ControlGroup {
  form: { valid: boolean };
}


class JSONValidator extends ErrorStateMatcher {
  constructor(private icc: ConfigureClicheComponent) {
    super();
  }

  isErrorState(
    control?: FormControl | null,
    form?: FormGroupDirective | NgForm
  ): boolean {
    if (!this.icc.configString) {
      return false;
    }
    if (!this.icc.configString.startsWith('{')) {
      return true;
    }
    try {
      JSON.parse(this.icc.configString);

      return false;
    } catch (e) {
      return true;
    }
  }
}


@Component({
  selector: 'app-configure-cliche',
  templateUrl: './configure-cliche.component.html',
  styleUrls: ['./configure-cliche.component.scss']
})
export class ConfigureClicheComponent implements OnInit {
  of: ClicheDefinition;
  name: string;
  configString: string;
  jsonValidator: JSONValidator;

  constructor(
    public dialogRef: MatDialogRef<ConfigureClicheComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.jsonValidator = new JSONValidator(this);
  }

  ngOnInit() {
    if (this.data.cliche) {
      this.of = this.data.cliche.of;
      this.name = this.data.cliche.name;
      this.configString = JSON.stringify(this.data.cliche.config);
    }
  }

  get clicheDefinitions() {
    return clicheDefinitions;
  }

  validate(form: ControlGroup) {
    return form.form.valid && !this.jsonValidator.isErrorState();
  }

  onSelectCliche(event: MatSelectChange) {
    this.name = event.value.name;
  }

  cancel() {
    this.dialogRef.close({ event: 'cancel' });
  }

  save(form: ControlGroup) {
    if (this.validate(form)) {
      let clicheInstance: ClicheInstance;
      if (this.data.cliche) {
        clicheInstance = this.data.cliche;
        clicheInstance.name = this.name;
        _.forEach(clicheInstance.config, (v, key) => {
          delete clicheInstance.config[key];
        });
      } else {
        clicheInstance = new ClicheInstance(this.name, this.of);
        this.data.app.cliches.push(clicheInstance);
      }
      if (this.configString) { // guaranteed to be valid JSON of object
        Object.assign(clicheInstance.config, JSON.parse(this.configString));
      }
      this.dialogRef.close({
        event: this.data.cliche ? 'update' : 'create',
        cliche: clicheInstance
      });
    }
  }

  delete() {
    if (window.confirm(
      'Are you sure you want to remove this Cliché? ' +
      'Any of its actions that you are using will be removed as well.'
    )) {
      this.data.app.actions.forEach((ad) => {
        ad.rows.forEach((r) => {
          _.remove(r.actions, (ai) => ai.from === this.data.cliche);
        });
      });
      _.remove(this.data.app.cliches, (c) => c === this.data.cliche);
      this.dialogRef.close({ event: 'delete', cliche: this.data.cliche });
    }
  }

}
