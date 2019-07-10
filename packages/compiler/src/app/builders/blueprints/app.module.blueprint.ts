import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { DvModule, USED_CLICHES_CONFIG, GATEWAY_URL } from '@deja-vu/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


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
    // Material Modules
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatGridListModule,
    MatListModule,
    MatStepperModule,
    MatTabsModule,
    MatProgressSpinnerModule,
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
