import { Component } from '@angular/core';

import { ShowUserComponent } from 'authentication';

import { ShowChoreComponent } from '../show-chore/show-chore.component';
import { ShowRewardComponent } from '../show-reward/show-reward.component';

@Component({
  selector: 'chorestar-parent-home',
  templateUrl: './parent-home.component.html',
  styleUrls: ['./parent-home.component.css']
})
export class ParentHomeComponent {
  loggedInUser;

  choreAssignee;
  choreId;

  showUser = ShowUserComponent;
  showChore = ShowChoreComponent;
  showReward = ShowRewardComponent;
}
