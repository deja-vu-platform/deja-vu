import { NgModule } from '@angular/core';

import { metadata } from './follow.metadata';

import { API_PATH } from './follow.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class FollowModule { }
