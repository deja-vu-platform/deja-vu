import { NgModule } from '@angular/core';

import { metadata } from './authorization.metadata';

import { API_PATH } from './authorization.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class AuthorizationModule { }
