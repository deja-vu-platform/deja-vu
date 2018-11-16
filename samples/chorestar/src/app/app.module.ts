import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { DvModule, GATEWAY_URL } from 'dv-core';


import { AppComponent } from './app.component';

import { AuthenticationModule } from 'authentication';
import { AuthorizationModule } from 'authorization';
import { GroupModule } from 'group';
import { PropertyModule } from 'property';
import { TaskModule } from 'task';
import { TRANSFER_CONFIG, TransferModule } from 'transfer';

import { ChildHomeComponent } from './child-home/child-home.component';
import { LandingComponent } from './landing/landing.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { ParentHomeComponent } from './parent-home/parent-home.component';
import { ShowChoreComponent } from './show-chore/show-chore.component';
import { ShowRewardComponent } from './show-reward/show-reward.component';
import { CreateChoreComponent } from './create-chore/create-chore.component';


@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    ParentHomeComponent,
    ChildHomeComponent,
    ShowChoreComponent,
    ShowRewardComponent,
    NavBarComponent,
    CreateChoreComponent
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
    TransferModule,
    TaskModule,
    GroupModule,
    PropertyModule
  ],
  providers: [
    { provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'},
    { provide: TRANSFER_CONFIG, useValue: { balanceType: 'money' } }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ShowChoreComponent,
    ShowRewardComponent
  ]
})
export class AppModule { }
