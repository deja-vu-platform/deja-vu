import { NgModule } from '@angular/core';

import { metadata } from './label.metadata';

import { API_PATH } from './label.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class LabelModule { }
