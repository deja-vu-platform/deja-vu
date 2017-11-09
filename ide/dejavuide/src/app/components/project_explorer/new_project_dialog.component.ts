import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';


@Component({
  selector: 'dv-new-project-dialog',
  templateUrl: 'new_project_dialog.component.html',
})
export class NewProjectDialogComponent {
  result = {
    name: 'New Project'
  };

  constructor(
    public dialogRef: MatDialogRef<NewProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    this.dialogRef.close(this.result);
  }

  onInput(newName: string) {
    this.result.name = newName;
  }

}
