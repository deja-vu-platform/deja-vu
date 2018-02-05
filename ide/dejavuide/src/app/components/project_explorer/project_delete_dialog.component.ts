import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';


@Component({
  selector: 'dv-delete-dialog',
  templateUrl: 'project_delete_dialog.component.html',
})
export class ProjectDeleteDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ProjectDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onDone(result: boolean): void {
    this.dialogRef.close(result);
  }
}
