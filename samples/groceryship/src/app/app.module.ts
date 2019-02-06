import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from "@angular/flex-layout";
import {
  MatDialogModule,
  MatMenuModule,
  MatButtonModule,
  MatDividerModule,
  MatIconModule,
  MatToolbarModule
} from '@angular/material';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';
import { DvModule, GATEWAY_URL } from '@deja-vu/core';

import { AppComponent } from './app.component';
import {
  AcceptRejectDeliveryDialogComponent
} from './accept-reject-delivery-dialog/accept-reject-delivery-dialog.component';
import {
  ChangePasswordDialogComponent
} from './change-password-dialog/change-password-dialog.component';
import {
  CloseDeliveryDialogComponent
} from './close-delivery-dialog/close-delivery-dialog.component';
import {
  CreateRequestComponent
} from './create-request/create-request.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DeliverComponent } from './deliver/deliver.component';
import {
  EditProfileDialogComponent
} from './edit-profile-dialog/edit-profile-dialog.component';
import { FaqComponent } from './faq/faq.component';
import { LoginComponent } from './login/login.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import {
  RegisterDialogComponent
} from './register-dialog/register-dialog.component';
import {
  RequestDetailsDialogComponent
} from './request-details-dialog/request-details-dialog.component';
import {
  ShowAcceptRequestNotificationComponent
} from './show-accept-request-notification/show-accept-request-notification.component';
import {
  ShowDeliverRequestComponent
} from './show-deliver-request/show-deliver-request.component';
import {
  ShowDeliverRequestNotificationComponent
} from './show-deliver-request-notification/show-deliver-request-notification.component';
import {
  SetDeliveryTimeDialogComponent
} from './set-delivery-time-dialog/set-delivery-time-dialog.component';
import {
  ShowMyRequestComponent
} from './show-my-request/show-my-request.component';
import {
  ShowPartySummaryComponent
} from './show-party-summary/show-party-summary.component';
import {
  ShowProfileComponent
} from './show-profile/show-profile.component';
import {
  ShowRequestDetailsComponent
} from './show-request-details/show-request-details.component';
import {
  ShowRequestTransactionComponent
} from './show-request-transaction/show-request-transaction.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

import { AuthenticationModule } from 'authentication';
import { AuthorizationModule } from 'authorization';
import { EventModule } from 'event';
import { MarketModule } from 'market';
import { PropertyModule } from 'property';
import { RatingModule } from 'rating';
import { TaskModule } from 'task';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NavBarComponent,
    DashboardComponent,
    CreateRequestComponent,
    DeliverComponent,
    UserProfileComponent,
    FaqComponent,
    ShowProfileComponent,
    ShowPartySummaryComponent,
    RegisterDialogComponent,

    AcceptRejectDeliveryDialogComponent, ChangePasswordDialogComponent,
    CloseDeliveryDialogComponent, EditProfileDialogComponent,
    RequestDetailsDialogComponent, SetDeliveryTimeDialogComponent,
    ShowAcceptRequestNotificationComponent, ShowDeliverRequestComponent,
    ShowDeliverRequestNotificationComponent, ShowMyRequestComponent,
    ShowRequestDetailsComponent, ShowRequestTransactionComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    FlexLayoutModule,
    MatDialogModule, MatMenuModule, MatButtonModule, MatDividerModule,
    MatIconModule, MatToolbarModule,
    MatExpansionModule,
    RouterModule.forRoot([
      { path: '', component: LoginComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'request', component: CreateRequestComponent },
      { path: 'deliver', component: DeliverComponent },
      { path: 'faq', component: FaqComponent },
      { path: 'profile', component: UserProfileComponent }
    ]),
    AuthenticationModule,
    AuthorizationModule,
    EventModule,
    MarketModule,
    PropertyModule,
    RatingModule,
    TaskModule
  ],
  providers: [{
    provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'
  }],
  bootstrap: [AppComponent],
  entryComponents: [
    AcceptRejectDeliveryDialogComponent, ChangePasswordDialogComponent,
    CloseDeliveryDialogComponent, EditProfileDialogComponent,
    RequestDetailsDialogComponent, SetDeliveryTimeDialogComponent,
    ShowAcceptRequestNotificationComponent, ShowDeliverRequestComponent,
    ShowDeliverRequestNotificationComponent, ShowMyRequestComponent,
    ShowRequestDetailsComponent, ShowRequestTransactionComponent,
    RegisterDialogComponent
  ]
})
export class AppModule { }
