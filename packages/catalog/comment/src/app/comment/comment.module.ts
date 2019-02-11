import { NgModule } from '@angular/core';

import { metadata } from './comment.metadata';

import { API_PATH } from './comment.config';


@NgModule({
  ...metadata,
  providers: [{ provide: API_PATH, useValue: '/graphql' }]
})
export class CommentModule { }
