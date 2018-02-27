import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { GATEWAY_URL, DvModule } from 'dv-core';


import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { ShowGroupMeetingComponent } from './show-group-meeting/show-group-meeting.component';
import { EventModule } from 'event';
import { CreateGroupMeetingComponent } from './create-group-meeting/create-group-meeting.component';
import { AllocatorModule } from 'allocator';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ShowGroupMeetingComponent,
    CreateGroupMeetingComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    EventModule,
    AllocatorModule
  ],
  entryComponents: [ShowGroupMeetingComponent],
  providers: [{
    provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
