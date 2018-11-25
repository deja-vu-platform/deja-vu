import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DvModule, GATEWAY_URL } from 'dv-core';

import { AppComponent } from './app.component';

import { AuthenticationModule } from 'authentication';
import { AuthorizationModule } from 'authorization';
import { CommentModule } from 'comment';
import { EventModule } from 'event';
import { GeolocationModule } from 'geolocation';
import { GroupModule } from 'group';
import { LabelModule } from 'label';
import { PostModule } from 'post';
import { PropertyModule } from 'property';
import { MainComponent } from './main/main.component';
import { AddCommentComponent } from './add-comment/add-comment.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { UserMenuComponent } from './user-menu/user-menu.component';
import { EventInfoWindowComponent } from './event-info-window/event-info-window.component';
import { EventPanelComponent } from './event-panel/event-panel.component';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { ShowEventCommentComponent } from './show-event-comment/show-event-comment.component';
import { ShowEventCommentsComponent } from './show-event-comments/show-event-comments.component';
import { ShowEventDetailsComponent } from './show-event-details/show-event-details.component';
import { ShowEventsByAttendeeComponent } from './show-events-by-attendee/show-events-by-attendee.component';
import { ShowEventsByHostComponent } from './show-events-by-host/show-events-by-host.component';
import { CreateEventComponent } from './create-event/create-event.component';
import { ShowUserProfileComponent } from './show-user-profile/show-user-profile.component';


@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    AddCommentComponent,
    EditProfileComponent,
    UserMenuComponent,
    EventInfoWindowComponent,
    EventPanelComponent,
    LoginComponent,
    RegistrationComponent,
    ShowEventCommentComponent,
    ShowEventCommentsComponent,
    ShowEventDetailsComponent,
    ShowEventsByAttendeeComponent,
    ShowEventsByHostComponent,
    CreateEventComponent,
    ShowUserProfileComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    RouterModule.forRoot([
      { path: 'main', component: MainComponent },
      { path: 'login', component: LoginComponent },
      { path: 'registration', component: RegistrationComponent },
      { path: 'event-details', component: ShowEventDetailsComponent },
      { path: 'create-event', component: CreateEventComponent },
      { path: 'profile', component: ShowUserProfileComponent },
      { path: 'edit-profile', component: EditProfileComponent }
    ]),
    AuthenticationModule,
    AuthorizationModule,
    CommentModule,
    EventModule,
    GeolocationModule,
    GroupModule,
    LabelModule,
    PostModule,
    PropertyModule
  ],
  providers: [
    { provide: GATEWAY_URL, useValue: 'http://localhost:3000/api' }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
     // anything with dv-include
  ]
})
export class AppModule { }
