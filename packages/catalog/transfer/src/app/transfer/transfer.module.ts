import { NgModule } from '@angular/core';

import { metadata } from './transfer.metadata';

import { API_PATH } from './transfer.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class TransferModule { }
