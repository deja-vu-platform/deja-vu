import { NgModule } from '@angular/core';

import { metadata } from './scoring.metadata';

import { API_PATH } from './scoring.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class ScoringModule { }
