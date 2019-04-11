import { NgModule } from '@angular/core';

import { metadata } from './chat.metadata';

import { API_PATH } from './chat.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class ChatModule { }
