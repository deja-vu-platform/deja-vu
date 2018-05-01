import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import {
  CreateMessageComponent
} from './create-message/create-message.component';
import {
  CreatePublisherComponent
} from './create-publisher/create-publisher.component';
import { EditMessageComponent } from './edit-message/edit-message.component';
import {
  FollowUnfollowComponent
} from './follow-unfollow/follow-unfollow.component';
import { ShowFollowerComponent } from './show-follower/show-follower.component';
import {
  ShowFollowersComponent
} from './show-followers/show-followers.component';
import { ShowMessageComponent } from './show-message/show-message.component';
import {
  ShowMessagesComponent
} from './show-messages/show-messages.component';
import {
  ShowPublisherComponent
} from './show-publisher/show-publisher.component';
import {
  ShowPublishersComponent
} from './show-publishers/show-publishers.component';

import {API_PATH} from './follow.config';

const allComponents = [
  CreateMessageComponent, CreatePublisherComponent, EditMessageComponent,
  FollowUnfollowComponent, ShowFollowerComponent, ShowFollowersComponent,
  ShowMessageComponent, ShowMessagesComponent, ShowPublisherComponent,
  ShowPublishersComponent
];

@NgModule({
  imports: [
    CommonModule, DvModule, FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatIconModule
  ],
  providers: [ { provide: API_PATH, useValue: '/graphql' } ],
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
})
export class FollowModule { }
