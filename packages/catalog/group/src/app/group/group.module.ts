import { NgModule } from '@angular/core';

import { metadata } from './group.metadata';

import { API_PATH } from './group.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class GroupModule { }
