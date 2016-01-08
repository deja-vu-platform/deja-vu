import {Component} from 'angular2/core';
import {OnInit} from 'angular2/core';

import {User} from '../../user';
import {FriendService} from '../../services/friend';


@Component({
  selector: 'add-friend',
  templateUrl: './friend/components/add-friend/add-friend.html',
  providers: [FriendService]
})
export class AddFriendComponent implements OnInit {
  users: User[];
  
  constructor(private _friendService: FriendService) {}

  addFriend(user: User) {
    console.log('added ' + user + ' as a friend');
  }
  ngOnInit() {
    this._friendService.getUsers().then(users => this.users = users);
  }
}
