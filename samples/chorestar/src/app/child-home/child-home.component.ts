import { Component, OnInit } from '@angular/core';

import { ShowChoreComponent } from '../show-chore/show-chore.component';
import { ShowRewardComponent } from '../show-reward/show-reward.component';

@Component({
  selector: 'chorestar-child-home',
  templateUrl: './child-home.component.html',
  styleUrls: ['./child-home.component.css']
})
export class ChildHomeComponent implements OnInit {
  showChore = ShowChoreComponent;
  showReward = ShowRewardComponent;
  showChild = true;

  constructor() { }

  ngOnInit() {
  }

}
