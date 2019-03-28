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
export { CreateMessageComponent };
import {
  CreatePublisherComponent
} from './create-publisher/create-publisher.component';
export { CreatePublisherComponent };
import { EditMessageComponent } from './edit-message/edit-message.component';
export { EditMessageComponent };
import {
  FollowUnfollowComponent
} from './follow-unfollow/follow-unfollow.component';
export { FollowUnfollowComponent };
import { ShowFollowerComponent } from './show-follower/show-follower.component';
export { ShowFollowerComponent };
import {
  ShowFollowersComponent
} from './show-followers/show-followers.component';
export { ShowFollowersComponent };
import { ShowMessageComponent } from './show-message/show-message.component';
export { ShowMessageComponent };
import {
  ShowMessagesComponent
} from './show-messages/show-messages.component';
export { ShowMessagesComponent };
import {
  ShowPublisherComponent
} from './show-publisher/show-publisher.component';
export { ShowPublisherComponent };
import {
  ShowPublishersComponent
} from './show-publishers/show-publishers.component';
export { ShowPublishersComponent };
import { ShowFollowerCountComponent } from './show-follower-count/show-follower-count.component';
export { ShowFollowerCountComponent };
import { ShowMessageCountComponent } from './show-message-count/show-message-count.component';
export { ShowMessageCountComponent };
import { ShowPublisherCountComponent } from './show-publisher-count/show-publisher-count.component';
export { ShowPublisherCountComponent };


const allComponents = [
  CreateMessageComponent, CreatePublisherComponent, EditMessageComponent,
  FollowUnfollowComponent, ShowFollowerComponent, ShowFollowersComponent,
  ShowMessageComponent, ShowMessagesComponent, ShowPublisherComponent,
  ShowPublishersComponent, ShowFollowerCountComponent, ShowMessageCountComponent, ShowPublisherCountComponent
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
