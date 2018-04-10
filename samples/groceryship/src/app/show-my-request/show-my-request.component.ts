import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import {
  RequestDetailsDialogComponent
} from '../request-details-dialog/request-details-dialog.component';

@Component({
  selector: 'groceryship-show-my-request',
  templateUrl: './show-my-request.component.html',
  styleUrls: ['./show-my-request.component.css']
})
export class ShowMyRequestComponent implements OnInit {
  @Input() request;

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  openRequestDetailsDialog(event) {
    event.stopPropagation();
    if (this.request) {
      this.dialog.open(RequestDetailsDialogComponent, {
        data: { request: this.request, myRequest: true}
      });
    }
  }
}
