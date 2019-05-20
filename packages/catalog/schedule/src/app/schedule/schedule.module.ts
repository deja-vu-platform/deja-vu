import { NgModule } from '@angular/core';

import { metadata } from './schedule.metadata';

import { API_PATH } from './schedule.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class ScheduleModule { }
