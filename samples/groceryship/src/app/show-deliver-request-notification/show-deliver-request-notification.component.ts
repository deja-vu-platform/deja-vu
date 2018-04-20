import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import {
  RequestDetailsDialogComponent
} from '../request-details-dialog/request-details-dialog.component';
import {
  CloseDeliveryDialogComponent
} from '../close-delivery-dialog/close-delivery-dialog.component';

@Component({
  selector: 'groceryship-show-deliver-request-notification',
  templateUrl: './show-deliver-request-notification.component.html',
  styleUrls: ['./show-deliver-request-notification.component.css']
})
export class ShowDeliverRequestNotificationComponent implements OnInit {
  @Input() request;

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  openRequestDetailsDialog() {
    if (this.request) {
      this.dialog.open(RequestDetailsDialogComponent, {
        data: { request: this.request, myRequest: false}
      });
    }
  }

  openCloseDeliveryDialog(event) {
    event.stopPropagation();
    if (this.request) {
      this.dialog.open(CloseDeliveryDialogComponent, {
        // can also specify dialog height and width here
        data: { request: this.request }
      });
    }
  }
}
