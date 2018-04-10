import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'groceryship-accept-reject-delivery-dialog',
  templateUrl: './accept-reject-delivery-dialog.component.html',
  styleUrls: ['./accept-reject-delivery-dialog.component.css']
})
export class AcceptRejectDeliveryDialogComponent {
  request;
  accept: boolean;

  constructor(
    public dialogRef: MatDialogRef<AcceptRejectDeliveryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { request: any, accept: boolean }) {
    this.request = this.data.request;
    this.accept = this.data.accept;
  }
}
