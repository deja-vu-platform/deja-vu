import { NgModule } from '@angular/core';

import { metadata } from './passkey.metadata';

import { API_PATH } from './passkey.config';

import { PasskeyService } from './shared/passkey.service';


@NgModule({
  ...metadata,
  providers: [
    PasskeyService,
    { provide: API_PATH, useValue: '/graphql' }
  ]
})
export class PasskeyModule { }
