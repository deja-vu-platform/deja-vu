import { NgModule } from '@angular/core';

import { metadata } from './ranking.metadata';

import { API_PATH } from './ranking.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class RankingModule { }
