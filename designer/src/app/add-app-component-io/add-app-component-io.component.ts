import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AppComponentDefinition } from '../datatypes';

export interface DialogData {
  ioType: 'input' | 'output';
  component: AppComponentDefinition;
}

interface ControlGroup {
  form: { valid: boolean };
}

@Component({
  selector: 'app-add-app-component-io',
  templateUrl: './add-app-component-io.component.html',
  styleUrls: ['./add-app-component-io.component.scss']
})
export class AddAppComponentIoComponent implements OnInit {
  name = '';
  ioType: string;

  constructor(
    private readonly dialogRef: MatDialogRef<AddAppComponentIoComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogData
  ) { }

  ngOnInit() {
    this.ioType = this.data.ioType;
  }

  validate(form: ControlGroup) {
    return form.form.valid;
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    this.data.component[this.ioType + 'Settings'].push({
      name: this.name, value: ''
    });
    this.dialogRef.close();
  }

}
