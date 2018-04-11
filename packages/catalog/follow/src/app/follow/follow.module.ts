import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  } from '.base-dir.ts/.base-dir.ts.component';
import { EditContentOfMessageComponent } from './edit-content-of-message/edit-content-of-message.component';
import { EditFollowsOfFollowerComponent } from './edit-follows-of-follower/edit-follows-of-follower.component';
import { EditNameOfFollowerComponent } from './edit-name-of-follower/edit-name-of-follower.component';
import { EditNameOfPublisherComponent } from './edit-name-of-publisher/edit-name-of-publisher.component';
import { FollowUnfollowComponent } from './follow-unfollow/follow-unfollow.component';
import { NewFollowerButtonComponent } from './new-follower-button/new-follower-button.component';
import { NewMessageButtonComponent } from './new-message-button/new-message-button.component';
import { NewPublisherButtonComponent } from './new-publisher-button/new-publisher-button.component';
import { ShowContentOfMessageComponent } from './show-content-of-message/show-content-of-message.component';
import { ShowFollowersComponent } from './show-followers/show-followers.component';
import { ShowFollowersByPublisherComponent } from './show-followers-by-publisher/show-followers-by-publisher.component';
import { ShowMessagesComponent } from './show-messages/show-messages.component';
import { ShowMessagesByFollowerComponent } from './show-messages-by-follower/show-messages-by-follower.component';
import { ShowMessagesByPublisherComponent } from './show-messages-by-publisher/show-messages-by-publisher.component';
import { ShowNameOfFollowerComponent } from './show-name-of-follower/show-name-of-follower.component';
import { ShowNameOfPublisherComponent } from './show-name-of-publisher/show-name-of-publisher.component';
import { ShowPublishersComponent } from './show-publishers/show-publishers.component';
import { ShowPublishersByFollowerComponent } from './show-publishers-by-follower/show-publishers-by-follower.component';
import { SharedComponent } from './-shared/-shared.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [.BaseDir.TsComponent, EditContentOfMessageComponent, EditFollowsOfFollowerComponent, EditNameOfFollowerComponent, EditNameOfPublisherComponent, FollowUnfollowComponent, NewFollowerButtonComponent, NewMessageButtonComponent, NewPublisherButtonComponent, ShowContentOfMessageComponent, ShowFollowersComponent, ShowFollowersByPublisherComponent, ShowMessagesComponent, ShowMessagesByFollowerComponent, ShowMessagesByPublisherComponent, ShowNameOfFollowerComponent, ShowNameOfPublisherComponent, ShowPublishersComponent, ShowPublishersByFollowerComponent, SharedComponent]
})
export class FollowModule { }
