import { NgModule } from '@angular/core';

import { metadata } from './chat.metadata';

import { API_PATH, SUBSCRIPTIONS_PATH } from './chat.config';


@NgModule({
  ...metadata,
  providers: [
    { provide: API_PATH, useValue: '/graphql' },
    { provide: SUBSCRIPTIONS_PATH, useValue: '/subscriptions' }
  ]
})
export class ChatModule { }
