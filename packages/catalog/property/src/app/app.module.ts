import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';

import { DvModule, GATEWAY_URL, USED_CONCEPTS_CONFIG } from '@deja-vu/core';

import { PropertyModule } from './property/property.module';

const usedConceptsConfig = {
  property: {
    config: {
      initialObjects: [
        {firstName: 'Alyssa', lastName: 'Hacker', age: 20}
      ],
      schema: {
        title: 'Person',
        type: 'object',
        properties: {
            firstName: {
                type: 'string'
            },
            lastName: {
                type: 'string'
            },
            age: {
             description: 'Age in years',
             type: 'integer',
             minimum: 0
            }
        },
        required: ['firstName', 'lastName']
      }
    }
  }
};


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    PropertyModule,
    RouterModule.forRoot([])
  ],
  providers: [
    { provide: GATEWAY_URL, useValue: 'localhost:3000/api' },
    { provide: USED_CONCEPTS_CONFIG, useValue: usedConceptsConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
