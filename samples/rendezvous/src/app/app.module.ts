import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DvModule, GATEWAY_URL } from 'dv-core';

import { AppComponent } from './app.component';

import {
  MatButtonModule, MatIconModule,
  MatCardModule, MatDialogModule
} from '@angular/material';

import { AuthenticationModule } from 'authentication';
import { AuthorizationModule } from 'authorization';
import { CommentModule } from 'comment';
import { EventModule } from 'event';
import { GeolocationModule } from 'geolocation';
import { GroupModule } from 'group';
import { LabelModule } from 'label';
import { PropertyModule } from 'property';
import { MainComponent } from './main/main.component';
import { EventInfoWindowComponent } from './event-info-window/event-info-window.component';
import { LoginComponent } from './login/login.component';
import { ShowEventCommentComponent } from './show-event-comment/show-event-comment.component';
import { ShowEventCommentsComponent } from './show-event-comments/show-event-comments.component';
import { ShowEventDetailsComponent } from './show-event-details/show-event-details.component';
import { ShowEventsByAttendeeComponent } from './show-events-by-attendee/show-events-by-attendee.component';
import { ShowEventsByHostComponent } from './show-events-by-host/show-events-by-host.component';
import { CreateEventComponent } from './create-event/create-event.component';
import { ShowUserProfileComponent } from './show-user-profile/show-user-profile.component';
import { RegisterComponent } from './register/register.component';
import { EditUserProfileComponent } from './edit-user-profile/edit-user-profile.component';
import { ShowEventSummaryComponent } from './show-event-summary/show-event-summary.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { ShowMemberNameComponent } from './show-member-name/show-member-name.component';


@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    EventInfoWindowComponent,
    LoginComponent,
    NavBarComponent,
    RegisterComponent,
    ShowEventCommentComponent,
    ShowEventCommentsComponent,
    ShowEventDetailsComponent,
    ShowEventsByAttendeeComponent,
    ShowEventsByHostComponent,
    CreateEventComponent,
    ShowUserProfileComponent,
    EditUserProfileComponent,
    ShowEventSummaryComponent,
    ShowMemberNameComponent
  ],
  imports: [
    BrowserModule,
    MatButtonModule, MatIconModule, MatCardModule, MatDialogModule,
    DvModule,
    AuthenticationModule,
    AuthorizationModule,
    CommentModule,
    EventModule,
    GeolocationModule,
    GroupModule,
    LabelModule,
    PropertyModule,
    RouterModule.forRoot([
      { path: 'main', component: MainComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'event-details', component: ShowEventDetailsComponent },
      { path: 'create-event', component: CreateEventComponent },
      { path: 'profile', component: ShowUserProfileComponent },
      { path: 'edit-profile', component: EditUserProfileComponent },
      { path: '', redirectTo: '/main', pathMatch: 'full' }
    ])
  ],
  providers: [
    { provide: GATEWAY_URL, useValue: 'http://localhost:3000/api' }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    NavBarComponent,
    ProfileOptionsComponent,
    ShowEventCommentComponent,
    ShowEventSummaryComponent,
    ShowMemberNameComponent
  ]
})
export class AppModule { }
