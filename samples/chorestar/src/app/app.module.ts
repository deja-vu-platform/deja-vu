import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DvModule, GATEWAY_URL } from 'dv-core';


import { AppComponent } from './app.component';

import { AuthenticationModule } from 'authentication';
import { AuthorizationModule } from 'authorization';
import { MarketModule } from 'market';
import { TaskModule } from 'task';
import { GroupModule } from 'group';
import { PropertyModule } from 'property';

import { LandingComponent } from './landing/landing.component';
import { ParentHomeComponent } from './parent-home/parent-home.component';
import { ChildHomeComponent } from './child-home/child-home.component';
import { ShowChoreComponent } from './show-chore/show-chore.component';
import { ShowRewardComponent } from './show-reward/show-reward.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';



@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    ParentHomeComponent,
    ChildHomeComponent,
    ShowChoreComponent,
    ShowRewardComponent,
    NavBarComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    RouterModule.forRoot([
      {path: 'parent', component: ParentHomeComponent},
      {path: 'child', component: ChildHomeComponent},
      {path: '', component: LandingComponent}
    ]),
    AuthenticationModule,
    AuthorizationModule,
    MarketModule,
    TaskModule,
    GroupModule,
    PropertyModule
  ],
  providers: [{
    provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'
  }],
  bootstrap: [AppComponent],
  entryComponents: [
    ShowChoreComponent,
    ShowRewardComponent
  ]
})
export class AppModule { }
