import { NgModule } from '@angular/core';

import { metadata } from './authentication.metadata';

import { API_PATH } from './authentication.config';

@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class AuthenticationModule { }
