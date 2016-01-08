import {Component} from 'angular2/core';
import {OnInit} from 'angular2/core';

import {User} from '../../user';
import {FriendService} from '../../services/friend';


@Component({
  selector: 'friends',
  templateUrl: './friend/components/friends/friends.html',
  providers: [FriendService]
})
export class FriendsComponent implements OnInit {
  friends: User[];
  
  constructor(private _friendService: FriendService) {}
  ngOnInit() {
    this._friendService.getFriends().then(friends => this.friends = friends);
  }
}
