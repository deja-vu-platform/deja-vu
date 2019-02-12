import { NgModule } from '@angular/core';

import { metadata } from './rating.metadata';

import { API_PATH } from './rating.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class RatingModule { }
