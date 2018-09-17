import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DvModule, GATEWAY_URL } from 'dv-core';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import {
  ShowGroupMeetingComponent
} from './show-group-meeting/show-group-meeting.component';

import { AllocatorModule } from 'allocator';
import { EventModule } from 'event';
import { PropertyModule } from 'property';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ShowGroupMeetingComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    EventModule,
    AllocatorModule,
    PropertyModule
  ],
  entryComponents: [ShowGroupMeetingComponent],
  providers: [{
    provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
