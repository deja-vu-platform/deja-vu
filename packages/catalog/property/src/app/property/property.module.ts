import { NgModule } from '@angular/core';

import { metadata } from './property.metadata';

import { API_PATH } from './property.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class PropertyModule { }
