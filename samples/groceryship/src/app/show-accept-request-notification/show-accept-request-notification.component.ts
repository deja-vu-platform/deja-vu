import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material';

import {
  AcceptRejectDeliveryDialogComponent
} from '../accept-reject-delivery-dialog/accept-reject-delivery-dialog.component';
import {
  RequestDetailsDialogComponent
} from '../request-details-dialog/request-details-dialog.component';

@Component({
  selector: 'groceryship-show-accept-request-notification',
  templateUrl: './show-accept-request-notification.component.html',
  styleUrls: ['./show-accept-request-notification.component.css']
})
export class ShowAcceptRequestNotificationComponent {
  @Input() request;

  constructor(public dialog: MatDialog) { }

  openRequestDetailsDialog() {
    if (this.request) {
      this.dialog.open(RequestDetailsDialogComponent, {
        data: { request: this.request, myRequest: true}
      })
    }
  }

  openAcceptRejectDeliveryDialog(event, accept: boolean) {
    event.stopPropagation();
    if (this.request) {
      this.dialog.open(AcceptRejectDeliveryDialogComponent, {
        // can also specify dialog height and width here
        data: { request: this.request, accept: accept }
      })
    }
  }
}
