import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

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


const allComponents = [
  CreateMessageComponent, CreatePublisherComponent, EditMessageComponent,
  FollowUnfollowComponent, ShowFollowerComponent, ShowFollowersComponent,
  ShowMessageComponent, ShowMessagesComponent, ShowPublisherComponent,
  ShowPublishersComponent
];

const metadata = {
  imports: [
    CommonModule, DvModule, FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatIconModule
  ],
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
};

export { metadata };
