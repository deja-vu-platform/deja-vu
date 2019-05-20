import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { GATEWAY_URL, DvModule } from '@deja-vu/core';
import { AppComponent } from './app.component';
import { AuthenticationModule } from './authentication/authentication.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AuthenticationModule,
    DvModule
  ],
  providers: [{ provide: GATEWAY_URL, useValue: 'localhost:3000/api' }],
  bootstrap: [AppComponent]
})
export class AppModule { }
