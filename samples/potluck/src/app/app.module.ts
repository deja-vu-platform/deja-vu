import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { ShowPartiesComponent } from './show-parties/show-parties.component';
import { RequestSupplyComponent } from './request-supply/request-supply.component';
import { ShowCommitmentComponent } from './show-commitment/show-commitment.component';
import { ShowPartyComponent } from './show-party/show-party.component';
import { ShowSuppliesComponent } from './show-supplies/show-supplies.component';
import { ShowSupplyRequestComponent } from './show-supply-request/show-supply-request.component';
import { CreatePartyComponent } from './create-party/create-party.component';


@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    NavBarComponent,
    ShowPartiesComponent,
    RequestSupplyComponent,
    ShowCommitmentComponent,
    ShowPartyComponent,
    ShowSuppliesComponent,
    ShowSupplyRequestComponent,
    CreatePartyComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
