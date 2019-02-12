import { NgModule } from '@angular/core';

import { metadata } from './event.metadata';

import { API_PATH } from './event.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class EventModule { }
