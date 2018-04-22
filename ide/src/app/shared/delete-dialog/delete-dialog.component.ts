import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';


@Component({
  selector: 'dv-delete-dialog',
  templateUrl: 'delete-dialog.component.html',
})
export class DeleteDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<DeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onDone(result: boolean): void {
    this.dialogRef.close(result);
  }
}
