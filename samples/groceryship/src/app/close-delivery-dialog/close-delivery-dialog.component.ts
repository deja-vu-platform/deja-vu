import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'groceryship-close-delivery-dialog',
  templateUrl: './close-delivery-dialog.component.html',
  styleUrls: ['./close-delivery-dialog.component.css']
})
export class CloseDeliveryDialogComponent {
  request;

  constructor(
    public dialogRef: MatDialogRef<CloseDeliveryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { request: any }) {
    this.request = this.data.request;
  }
}
