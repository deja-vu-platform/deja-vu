import { NgModule } from '@angular/core';

import { metadata } from './allocator.metadata';

import { API_PATH } from './allocator.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class AllocatorModule { }
