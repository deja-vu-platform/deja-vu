import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {User, Username} from "../../shared/user";
import {GraphQlService} from "gql";


@Component({
  selector: "friends",
  templateUrl: "./components/friends/friends.html",
  styleUrls: ["./components/friends/friends.css"],
  providers: [GraphQlService, HTTP_PROVIDERS],
  inputs: ["username"]
})
export class FriendsComponent {
  friends: User[];
  private _username: Username;

  constructor(private _graphQlService: GraphQlService) {}

  unfriend(user: User) {
    console.log(`unfriending ${user.username}`);
    this._graphQlService
      .post(`
        unfriend(username1: "${this.username}", username2: "${user.username}")
      `)
      .subscribe(res => undefined);
  }

  get username() {
    return this._username;
  }

  set username(username: Username) {
    if (!username) return;
    console.log("got as input " + username);
    this._username = username;
    this._graphQlService
      .get(`
        user(username: "${username}") {
          friends {
            username
          }
        }
      `)
      .subscribe(friends => this.friends = friends);
  }
}
