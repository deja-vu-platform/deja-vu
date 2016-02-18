import {Component, Input} from "angular2/core";
import {OnInit} from "angular2/core";

import {User, Username} from "../../shared/user";
import {FriendService} from "../shared/friend";


@Component({
  selector: "add-friend",
  templateUrl: "./components/add-friend/add-friend.html",
  providers: [FriendService]
})
export class AddFriendComponent implements OnInit {
  @Input() username: Username;
  potentialFriends: User[];

  constructor(private _friendService: FriendService) {}

  addFriend(user: User) {
    console.log(`adding ${user.username} as friend`);
    this._friendService.addFriend(this.username, user.username).subscribe(
        res => undefined);
  }

  ngOnInit() {
    this._friendService.getPotentialFriends(this.username).subscribe(
        potentialFriends => this.potentialFriends = potentialFriends);
  }
}
