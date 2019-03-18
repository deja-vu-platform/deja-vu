import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AppActionDefinition } from '../datatypes';

export interface DialogData {
  ioType: 'input' | 'output';
  action: AppActionDefinition;
}

interface ControlGroup {
  form: { valid: boolean };
}

@Component({
  selector: 'app-add-app-action-io',
  templateUrl: './add-app-action-io.component.html',
  styleUrls: ['./add-app-action-io.component.scss']
})
export class AddAppActionIoComponent implements OnInit {
  name = '';
  ioType: string;

  constructor(
    private readonly dialogRef: MatDialogRef<AddAppActionIoComponent>,
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
    this.data.action[this.ioType + 'Settings'].push({
      name: this.name, value: ''
    });
    this.dialogRef.close();
  }

}
