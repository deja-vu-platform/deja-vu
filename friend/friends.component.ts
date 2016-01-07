import {Component} from 'angular2/core';
import {OnInit} from 'angular2/core';

import {User} from './user';
import {FriendService} from './friend.service';


@Component({
  selector: 'friends',
  templateUrl: './friend/friends.template.html',
  providers: [FriendService]
})
export class FriendsComponent implements OnInit {
  friends: User[];
  
  constructor(private _friendService: FriendService) {}
  ngOnInit() {
    this._friendService.getFriends().then(friends => this.friends = friends);
  }
}
