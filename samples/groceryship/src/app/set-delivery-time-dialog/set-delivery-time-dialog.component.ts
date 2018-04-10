import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';


@Component({
  selector: 'groceryship-set-delivery-time-dialog',
  templateUrl: './set-delivery-time-dialog.component.html',
  styleUrls: ['./set-delivery-time-dialog.component.css']
})
export class SetDeliveryTimeDialogComponent {
  request;

  constructor(
    public dialogRef: MatDialogRef<SetDeliveryTimeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { request: any }) {
    this.request = this.data.request;
  }
}
