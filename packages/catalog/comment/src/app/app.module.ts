import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { GATEWAY_URL } from 'dv-core';
import { AppComponent } from './app.component';
import { CommentModule } from './comment/comment.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    CommentModule
  ],
  providers: [{provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'}],
  bootstrap: [AppComponent]
})
export class AppModule { }
