import { Component, OnInit } from '@angular/core';

import {
  ShowAcceptRequestNotificationComponent
} from '../show-accept-request-notification/show-accept-request-notification.component';
import {
  ShowDeliverRequestNotificationComponent
} from '../show-deliver-request-notification/show-deliver-request-notification.component';
import {
  ShowDeliverRequestComponent
} from '../show-deliver-request/show-deliver-request.component';
import {
  ShowMyRequestComponent
} from '../show-my-request/show-my-request.component';

@Component({
  selector: 'groceryship-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  showAcceptRequestNotification = ShowAcceptRequestNotificationComponent;
  showDeliverRequestNotification = ShowDeliverRequestNotificationComponent;
  showDeliverRequest = ShowDeliverRequestComponent;
  showMyRequest = ShowMyRequestComponent;

  constructor() { }

  ngOnInit() {
  }

}
