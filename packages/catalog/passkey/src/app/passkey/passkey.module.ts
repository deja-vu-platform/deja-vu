import { NgModule } from '@angular/core';

import { metadata } from './passkey.metadata';

import { API_PATH } from './passkey.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class PasskeyModule { }
