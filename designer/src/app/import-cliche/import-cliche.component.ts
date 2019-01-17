import { Component, Inject } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import {
  ErrorStateMatcher,
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatSelectChange
} from '@angular/material';

import { clicheDefinitions } from '../cliche.module';
import { App, ClicheDefinition, ClicheInstance } from '../datatypes';


export interface DialogData {
  app: App;
}

interface ControlGroup {
  form: { valid: boolean };
}


class JSONValidator extends ErrorStateMatcher {
  constructor(private icc: ImportClicheComponent) {
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
  selector: 'app-import-cliche',
  templateUrl: './import-cliche.component.html',
  styleUrls: ['./import-cliche.component.scss']
})
export class ImportClicheComponent {
  of: ClicheDefinition;
  name: string;
  configString: string;
  jsonValidator: JSONValidator;

  constructor(
    public dialogRef: MatDialogRef<ImportClicheComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.jsonValidator = new JSONValidator(this);
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
    this.dialogRef.close();
  }

  save(form: ControlGroup) {
    if (this.validate(form)) {
      const clicheInstance = new ClicheInstance(this.name, this.of);
      if (this.configString) { // guaranteed to be valid JSON of object
        Object.assign(clicheInstance.config, JSON.parse(this.configString));
      }
      this.data.app.cliches.push(clicheInstance);
      this.dialogRef.close();
    }
  }

}
