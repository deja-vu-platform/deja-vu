import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { DvModule, GATEWAY_URL, USED_CONCEPTS_CONFIG } from '@deja-vu/core';
import { AppComponent } from './app.component';
import { ScheduleModule } from './schedule/schedule.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ScheduleModule,
    RouterModule.forRoot([]),
    DvModule
  ],
  providers: [
    { provide: GATEWAY_URL, useValue: 'localhost:3000/api' },
    { provide: USED_CONCEPTS_CONFIG, useValue: {} }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
