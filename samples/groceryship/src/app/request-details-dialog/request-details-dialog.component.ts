import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'groceryship-request-details-dialog',
  templateUrl: './request-details-dialog.component.html',
  styleUrls: ['./request-details-dialog.component.css']
})
export class RequestDetailsDialogComponent {
  request;
  myRequest: boolean;

  constructor(
    public dialogRef: MatDialogRef<RequestDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { request: any, myRequest: boolean }) {
    this.request = this.data.request;
    this.myRequest = this.data.myRequest;
  }
}
