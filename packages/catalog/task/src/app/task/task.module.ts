import { NgModule } from '@angular/core';

import { metadata } from './task.metadata';

import { API_PATH } from './task.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class TaskModule { }
