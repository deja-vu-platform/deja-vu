import { NgModule } from '@angular/core';

import { metadata } from './authentication.metadata';

import { API_PATH } from './authentication.config';

import { AuthenticationService } from './shared/authentication.service';

@NgModule({
  ...metadata,
  providers: [
    AuthenticationService,
    { provide: API_PATH, useValue: '/graphql' }
  ]
})
export class AuthenticationModule { }
