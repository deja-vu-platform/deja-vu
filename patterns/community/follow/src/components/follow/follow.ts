import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";
import {Observable} from "rxjs/observable";

import {User, Username} from "../../shared/user";
import {GraphQlService} from "../shared/graphql";


@Component({
  selector: "follow",
  templateUrl: "./components/follow/follow.html",
  providers: [GraphQlService, HTTP_PROVIDERS],
  inputs: ["username"]
})
export class FollowComponent {
  potentialFollows: User[];
  private _username: Username;

  constructor(private _graphQlService: GraphQlService) {}

  follow(user: User) {
    console.log(`following ${user.username}`);
    this._follow(this._username, user.username).subscribe(res => undefined);
  }

  get username() {
    return this._username;
  }

  set username(username: Username) {
    if (!username) return;
    console.log("got username " + username);
    this._username = username;
    this._getPotentialFollows(this._username).subscribe(
        potentialFollows => this.potentialFollows = potentialFollows);
  }

  private _getPotentialFollows(username: Username): Observable<User[]> {
    return this._graphQlService.get(`{
      user(username: "${username}") {
        username,
        potentialFollows {
          username
        } 
      }
    }`).map(data => data.user.potentialFollows);
  }

  private _follow(username: Username, target: Username): any {
    return this._graphQlService.post(`{
      follow(username: "${username}", target: "${target}")
    }`);
  }
}
