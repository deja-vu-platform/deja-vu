import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';


@Component({
  selector: 'dv-new-project-dialog',
  templateUrl: 'project_delete_dialog.component.html',
})
export class NewProjectDialogComponent {
  name = 'New Project';
  result = {
    name: name
  };
  
  constructor(
    public dialogRef: MatDialogRef<NewProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
