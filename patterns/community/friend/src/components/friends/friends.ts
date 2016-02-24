import {Component, Input} from "angular2/core";
import {OnInit} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {User, Username} from "../../shared/user";
import {FriendService} from "../shared/friend";


@Component({
  selector: "friends",
  templateUrl: "./components/friends/friends.html",
  providers: [FriendService, HTTP_PROVIDERS]
})
export class FriendsComponent implements OnInit {
  @Input() username: Username;
  friends: User[];

  constructor(private _friendService: FriendService) {}

  unfriend(user: User) {
    console.log(`unfriending ${user.username}`);
    this._friendService.unfriend(this.username, user.username).subscribe(
      res => undefined);
  }

  ngOnInit() {
    console.log("got as input " + this.username);
    this._friendService.getFriends(this.username).subscribe(
      friends => this.friends = friends);
  }
}
