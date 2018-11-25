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


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    RouterModule.forRoot([]),
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
