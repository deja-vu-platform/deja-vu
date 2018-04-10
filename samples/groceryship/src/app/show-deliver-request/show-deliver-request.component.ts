import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import {
    SetDeliveryTimeDialogComponent
} from '../set-delivery-time-dialog/set-delivery-time-dialog.component';

@Component({
  selector: 'groceryship-show-deliver-request',
  templateUrl: './show-deliver-request.component.html',
  styleUrls: ['./show-deliver-request.component.css']
})
export class ShowDeliverRequestComponent {
  @Input() request;
  @Input() claimAssigneeId: string;

  constructor(public dialog: MatDialog) { }

  openSetDeliveryTimeDialog(accept: boolean) {
    if (this.request) {
      this.dialog.open(SetDeliveryTimeDialogComponent, {
        // can also specify dialog height and width here
        data: { request: this.request }
      });
    }
  }
}
