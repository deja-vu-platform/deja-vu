import { NgModule } from '@angular/core';

import { metadata } from './<%= dasherize(clicheName) %>.metadata';

import { API_PATH } from './<%= dasherize(clicheName) %>.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class <%= classify(clicheName) %>Module { }
