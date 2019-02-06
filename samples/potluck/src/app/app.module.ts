import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DvModule, GATEWAY_URL } from '@deja-vu/core';

import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { ShowPartiesComponent } from './show-parties/show-parties.component';
import { ShowPartyComponent } from './show-party/show-party.component';
import { CreatePartyComponent } from './create-party/create-party.component';

import { AuthenticationModule } from 'authentication';
import { AuthorizationModule } from 'authorization';
import { TransferModule, TRANSFER_CONFIG } from 'transfer';
import { EventModule } from 'event';
import { GroupModule } from 'group';
import { PropertyModule } from 'property';
import { ShowSupplyComponent } from './show-supply/show-supply.component';
import { ClaimSupplyComponent } from './claim-supply/claim-supply.component';
import { CreateSupplyComponent } from './create-supply/create-supply.component';
import { ShowClaimComponent } from './show-claim/show-claim.component';
import { SupplyListHeaderComponent } from './supply-list-header/supply-list-header.component';
import { GuestListHeaderComponent } from './guest-list-header/guest-list-header.component';


@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    NavBarComponent,
    ShowPartiesComponent,
    ShowPartyComponent,
    CreatePartyComponent,
    ShowSupplyComponent,
    CreateSupplyComponent,
    ClaimSupplyComponent,
    ShowClaimComponent,
    SupplyListHeaderComponent,
    GuestListHeaderComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    RouterModule.forRoot([
      {path: 'parties', component: ShowPartiesComponent},
      {path: 'create-party', component: CreatePartyComponent},
      {path: '', component: LandingComponent}
    ]),
    AuthenticationModule,
    AuthorizationModule,
    TransferModule,
    EventModule,
    GroupModule,
    PropertyModule
  ],
  providers: [
    { provide: GATEWAY_URL, useValue: 'http://localhost:3000/api' },
    { provide: TRANSFER_CONFIG, useValue: { balanceType: 'items' } }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ShowPartyComponent, CreateSupplyComponent, ShowSupplyComponent,
    ShowClaimComponent, SupplyListHeaderComponent,
    GuestListHeaderComponent, ClaimSupplyComponent
  ]
})
export class AppModule { }
