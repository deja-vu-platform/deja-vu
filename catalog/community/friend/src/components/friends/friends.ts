import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {User, Username} from "../../shared/user";
import {FriendService} from "../shared/friend";


@Component({
  selector: "friends",
  templateUrl: "./components/friends/friends.html",
  styleUrls: ["./components/friends/friends.css"],
  providers: [FriendService, HTTP_PROVIDERS],
  inputs: ["username"]
})
export class FriendsComponent {
  friends: User[];
  private _username: Username;

  constructor(private _friendService: FriendService) {}

  unfriend(user: User) {
    console.log(`unfriending ${user.username}`);
    this._friendService.unfriend(this.username, user.username).subscribe(
      res => undefined);
  }

  get username() {
    return this._username;
  }

  set username(username: Username) {
    if (!username) return;
    console.log("got as input " + username);
    this._username = username;
    this._friendService.getFriends(this._username).subscribe(
      friends => this.friends = friends);
  }
}
