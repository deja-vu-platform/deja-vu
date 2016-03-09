import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {User, Username} from "../../shared/user";
import {FriendService} from "../shared/friend";


@Component({
  selector: "add-friend",
  templateUrl: "./components/add-friend/add-friend.html",
  providers: [FriendService, HTTP_PROVIDERS],
  inputs: ["username"]
})
export class AddFriendComponent {
  potentialFriends: User[];
  private _username: Username;

  constructor(private _friendService: FriendService) {}

  addFriend(user: User) {
    console.log(`adding ${user.username} as friend`);
    this._friendService.addFriend(this._username, user.username).subscribe(
        res => undefined);
  }

  get username() {
    return this._username;
  }

  set username(username: Username) {
    if (!username) return;
    console.log("got username " + username);
    this._username = username;
    this._friendService.getPotentialFriends(this._username).subscribe(
        potentialFriends => this.potentialFriends = potentialFriends);
  }
}
