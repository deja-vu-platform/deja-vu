import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HeaderModule } from './components/common/header/header.module';
import { ZoomModule } from './components/ui_editor/zoom/zoom.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HeaderModule,
    ZoomModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
