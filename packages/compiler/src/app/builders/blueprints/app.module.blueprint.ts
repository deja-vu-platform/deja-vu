import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { DvModule, USED_CONCEPTS_CONFIG, GATEWAY_URL } from '@deja-vu/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';


import { AppComponent } from './app.component';

@@componentImports

@@moduleImports

const components = [ AppComponent, @@components ];

@NgModule({
  declarations: components,
  imports: [
    BrowserModule,
    DvModule,
    RouterModule.forRoot([ @@routes ], { onSameUrlNavigation: 'reload' }),
    // Material Modules
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatGridListModule,
    MatListModule,
    MatStepperModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    @@modules
  ],
  entryComponents: components,
  providers: [
    { provide: GATEWAY_URL, useValue: '@@gatewayUrl' },
    { provide: USED_CONCEPTS_CONFIG, useValue: @@usedConceptsConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
