import {User, Username} from "../../shared/user";
import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({ng2_providers: [GraphQlService]})
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
