import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { DvModule, USED_CLICHES_CONFIG, GATEWAY_URL } from '@deja-vu/core';

import { AppComponent } from './app.component';

@@componentImports

@@moduleImports

const components = [ AppComponent, @@components ];

@NgModule({
  declarations: components,
  imports: [
    BrowserModule,
    DvModule,
    RouterModule.forRoot([ @@routes ]),
    @@modules
  ],
  entryComponents: components,
  providers: [
    { provide: GATEWAY_URL, useValue: 'localhost:3000/api' },
    { provide: USED_CLICHES_CONFIG, useValue: @@usedClichesConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
