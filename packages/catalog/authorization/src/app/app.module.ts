import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { DvModule, GATEWAY_URL } from '@deja-vu/core';
import { AppComponent } from './app.component';
import { AuthorizationModule } from './authorization/authorization.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AuthorizationModule,
    DvModule
  ],
  providers: [{ provide: GATEWAY_URL, useValue: 'localhost:3000/api' }],
  bootstrap: [AppComponent]
})
export class AppModule { }
