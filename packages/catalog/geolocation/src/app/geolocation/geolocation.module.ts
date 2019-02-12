import { NgModule } from '@angular/core';

import { metadata } from './geolocation.metadata';

import { API_PATH } from './geolocation.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class GeolocationModule { }
