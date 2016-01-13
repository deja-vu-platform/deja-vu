import {Component, Input} from 'angular2/core';
import {OnInit} from 'angular2/core';

import {User, Username} from '../../user';
import {FriendService} from '../../services/friend';


@Component({
  selector: 'friends',
  templateUrl: './friend/components/friends/friends.html',
  providers: [FriendService]
})
export class FriendsComponent implements OnInit {
  @Input() username: Username;
  friends: User[];
  
  constructor(private _friendService: FriendService) {}

  unfriend(user: User) {
    console.log(`unfriending ${user.username}`);
    this._friendService.unfriend(this.username, user.username).subscribe(res => {});
  }

  ngOnInit() {
    console.log('got as input ' + this.username);
    this._friendService.getFriends(this.username).subscribe(
      friends => this.friends = friends);
  }
}
