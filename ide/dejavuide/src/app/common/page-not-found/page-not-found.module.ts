import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { Component } from '@angular/core';

@Component({
  selector: 'dv-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: []
})
export class PageNotFoundComponent {
}

@NgModule({
  declarations: [
    PageNotFoundComponent
  ],
  imports: [
    BrowserModule,
  ],
  providers: [],
  exports: [
    PageNotFoundComponent
  ]
})
export class PageNotFoundModule { }
