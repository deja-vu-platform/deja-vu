import { NgModule } from '@angular/core';

import { metadata } from './<%= dasherize(conceptName) %>.metadata';

import { API_PATH } from './<%= dasherize(conceptName) %>.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class <%= classify(conceptName) %>Module { }
