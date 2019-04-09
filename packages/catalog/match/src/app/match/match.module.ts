import { NgModule } from '@angular/core';

import { metadata } from './match.metadata';

import { API_PATH } from './match.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class MatchModule { }
