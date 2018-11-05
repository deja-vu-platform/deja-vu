import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { DvModule, GATEWAY_URL } from 'dv-core';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { NavbarComponent } from './navbar/navbar.component';
import { ShowCommentComponent } from './show-comment/show-comment.component';
import { ShowPostComponent } from './show-post/show-post.component';
import { ShowPostPageComponent } from './show-post-page/show-post-page.component';
import { SubmitPostComponent } from './submit-post/submit-post.component';

import { AuthenticationModule } from 'authentication';
import { CommentModule } from 'comment';
import { PropertyModule } from 'property';
import { ScoringModule } from 'scoring';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    NavbarComponent,
    ShowCommentComponent,
    ShowPostComponent,
    ShowPostPageComponent,
    SubmitPostComponent
  ],
  imports: [
    AuthenticationModule,
    BrowserModule,
    CommentModule,
    DvModule,
    PropertyModule,
    RouterModule.forRoot([
      { path: 'item', component: ShowPostPageComponent },
      { path: 'login', component: LoginComponent },
      { path: 'news', component: HomeComponent },
      { path: 'submit', component: SubmitPostComponent },
      { path: '', redirectTo: '/news', pathMatch: 'full' },
    ]),
    ScoringModule
  ],
  entryComponents: [ NavbarComponent, ShowCommentComponent, ShowPostComponent ],
  providers: [{
    provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
