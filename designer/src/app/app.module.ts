import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { EventModule } from 'event';

import { AppComponent } from './app.component';
import { MainViewComponent } from './main-view/main-view.component';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { TopBarComponent } from './top-bar/top-bar.component';


@NgModule({
  declarations: [
    AppComponent,
    MainViewComponent,
    SideMenuComponent,
    TopBarComponent,
  ],
  imports: [
    BrowserModule,
    EventModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
