import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClaimRequestComponent } from './claim-request/claim-request.component';
import { CreateRequestComponent } from './create-request/create-request.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DeliverComponent } from './deliver/deliver.component';
import { FaqComponent } from './faq/faq.component';
import { LoginComponent } from './login/login.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { NavBarLoggedInComponent } from './nav-bar-logged-in/nav-bar-logged-in.component';
import { NotificationItemModalComponent } from './notification-item-modal/notification-item-modal.component';
import { SetDeliveryTimeComponent } from './set-delivery-time/set-delivery-time.component';
import { ShowAcceptRequestNotificationComponent } from './show-accept-request-notification/show-accept-request-notification.component';
import { ShowDeliverRequestComponent } from './show-deliver-request/show-deliver-request.component';
import { ShowDeliverRequestNotificationComponent } from './show-deliver-request-notification/show-deliver-request-notification.component';
import { ShowMyRequestComponent } from './show-my-request/show-my-request.component';
import { ShowRequestItemComponent } from './show-request-item/show-request-item.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ClaimRequestComponent, CreateRequestComponent, DashboardComponent, DeliverComponent, FaqComponent, LoginComponent, NavBarComponent, NavBarLoggedInComponent, NotificationItemModalComponent, SetDeliveryTimeComponent, ShowAcceptRequestNotificationComponent, ShowDeliverRequestComponent, ShowDeliverRequestNotificationComponent, ShowMyRequestComponent, ShowRequestItemComponent, UserProfileComponent]
})
export class GroceryShipModule { }
