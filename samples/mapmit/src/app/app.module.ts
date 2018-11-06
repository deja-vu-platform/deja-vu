import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DvModule, GATEWAY_URL } from 'dv-core';

import { AppComponent } from './app.component';

import { AuthenticationModule } from 'authentication';
import { AuthorizationModule } from 'authorization';
import { EventModule } from 'event';
import { GeolocationModule } from 'geolocation';
import { GroupModule } from 'group';
import { PropertyModule } from 'property';

import { CreateEventComponent } from './create-event/create-event.component';
import { GroupWithUserComponent } from './group-with-user/group-with-user.component';
import { EventInfoWindowComponent } from './event-info-window/event-info-window.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { UserEventsComponent } from './user-events/user-events.component';
import { UserGroupsComponent } from './user-groups/user-groups.component';
import { SignupComponent } from './signup/signup.component';
import { ShowEventInfoComponent } from './show-event-info/show-event-info.component';
import { ShowEventsInfoComponent } from './show-events-info/show-events-info.component';


@NgModule({
  declarations: [
    AppComponent,
    CreateEventComponent,
    GroupWithUserComponent,
    EventInfoWindowComponent,
    HomeComponent,
    LoginComponent,
    NavBarComponent,
    UserEventsComponent,
    UserGroupsComponent,
    SignupComponent,
    ShowEventInfoComponent,
    ShowEventsInfoComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    RouterModule.forRoot([
      { path: 'home', component: HomeComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'login', component: LoginComponent },
      { path: 'user-events', component: UserEventsComponent },
      { path: 'create-event', component: CreateEventComponent },
      { path: 'user-groups', component: UserGroupsComponent }
    ]),
    AuthenticationModule,
    AuthorizationModule,
    EventModule,
    GeolocationModule,
    GroupModule,
    PropertyModule
  ],
  providers: [
    { provide: GATEWAY_URL, useValue: 'http://localhost:3000/api' }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ShowEventInfoComponent, // anything with dv-include
    GroupWithUserComponent
  ]
})
export class AppModule { }
