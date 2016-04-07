import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";
import {Observable} from "rxjs/observable";

import {User, Username} from "../../shared/user";
import {GraphQlService} from "../shared/graphql";


interface UserFollowInfo {
  username: Username;
  followed_by: boolean;
}

@Component({
  selector: "edit-follow",
  templateUrl: "./components/edit-follow/edit-follow.html",
  providers: [GraphQlService, HTTP_PROVIDERS],
  inputs: ["username"]
})
export class EditFollowComponent {
  users: UserFollowInfo[];
  private _username: Username;

  constructor(private _graphQlService: GraphQlService) {}

  follow(user: User) {
    console.log(`following ${user.username}`);
    this._follow(this._username, user.username).subscribe(res => undefined);
  }

  unfollow(user: User) {
    console.log(`unfollowing ${user.username}`);
    this._unfollow(this._username, user.username).subscribe(res => undefined);
  }

  get username() {
    return this._username;
  }

  set username(username: Username) {
    if (!username) return;
    console.log("got username " + username);
    this._username = username;
    this._getUsersWithFollowInfo(this._username).subscribe(
        users => this.users = users);
  }

  private _getUsersWithFollowInfo(
      username: Username): Observable<UserFollowInfo[]> {
    return this._graphQlService.get(`{
      users {
        username,
        followed_by(username: "${username}")
      }
    }`).map(data => data.users.filter(u => u.username !== this._username));
  }

  private _follow(username: Username, target: Username): any {
    return this._graphQlService.post(`{
      follow(username: "${username}", target: "${target}")
    }`);
  }

  private _unfollow(username: Username, target: Username): any {
    return this._graphQlService.post(`{
      unfollow(username: "${username}", target: "${target}")
    }`);
  }
}
