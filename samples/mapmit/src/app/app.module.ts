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
import { ShowGroupComponent } from './show-group/show-group.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { ShowMyEventsComponent } from './show-my-events/show-my-events.component';
import { ShowMyGroupsComponent } from './show-my-groups/show-my-groups.component';
import { SignupComponent } from './signup/signup.component';
import { ShowEventInfoComponent } from './show-event-info/show-event-info.component';
import { ShowEventsComponent } from './show-events/show-events.component';


@NgModule({
  declarations: [
    AppComponent,
    CreateEventComponent,
    ShowGroupComponent,
    HomeComponent,
    LoginComponent,
    NavBarComponent,
    ShowMyEventsComponent,
    ShowMyGroupsComponent,
    SignupComponent,
    ShowEventInfoComponent,
    ShowEventsComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    RouterModule.forRoot([
      { path: 'home', component: HomeComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'login', component: LoginComponent },
      { path: 'my-events', component: ShowMyEventsComponent },
      { path: 'create-event', component: CreateEventComponent },
      { path: 'my-groups', component: ShowMyGroupsComponent }
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
    ShowGroupComponent
  ]
})
export class AppModule { }
