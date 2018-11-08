import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { DvModule, GATEWAY_URL } from 'dv-core';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { NavbarComponent } from './navbar/navbar.component';
import {
  RedirectToLoginComponent
} from './redirect-to-login/redirect-to-login.component';
import { ShowCommentComponent } from './show-comment/show-comment.component';
import { ShowPostComponent } from './show-post/show-post.component';
import {
  ShowPostDetailsComponent
} from './show-post-details/show-post-details.component';
import { SubmitPostComponent } from './submit-post/submit-post.component';
import { UpvoteComponent } from './upvote/upvote.component';

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
    RedirectToLoginComponent,
    ShowCommentComponent,
    ShowPostComponent,
    ShowPostDetailsComponent,
    SubmitPostComponent,
    UpvoteComponent
  ],
  imports: [
    AuthenticationModule,
    BrowserModule,
    CommentModule,
    DvModule,
    PropertyModule,
    RouterModule.forRoot([
      { path: 'item', component: ShowPostDetailsComponent },
      { path: 'login', component: LoginComponent },
      { path: 'news', component: HomeComponent },
      { path: 'submit', component: SubmitPostComponent },
      { path: '', redirectTo: '/news', pathMatch: 'full' },
    ]),
    ScoringModule
  ],
  entryComponents: [
    NavbarComponent, RedirectToLoginComponent, ShowCommentComponent,
    ShowPostComponent, UpvoteComponent
  ],
  providers: [{
    provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
