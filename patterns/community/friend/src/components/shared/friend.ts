import {Injectable, Inject} from "angular2/core";
import {Http} from "angular2/http";
import {Observable} from "rxjs/observable";

import {User, Username} from "../../shared/user";


@Injectable()
export class FriendService {
  constructor(
    private _http: Http, @Inject("friend.api") private _api: String) {}

  getFriends(username: Username): Observable<User[]> {
    return this._http.get(
      this._api + `/users/${username}/friends` + "?fields=username,friends")
      .map(res => res.json());
  }

  addFriend(u1: Username, u2: Username): any {
    return this._http.put(this._api + `/users/${u1}/friends/${u2}`, "")
      .map(res => res.json());
  }

  unfriend(u1: Username, u2: Username): any {
    return this._http.delete(this._api + `/users/${u1}/friends/${u2}`)
      .map(res => res.json());
  }

  getPotentialFriends(username: Username): Observable<User[]> {
    return this._http.get(
      this._api + `/users/${username}/potential_friends` +
      "?fields=username,friends")
      .map(res => res.json());
  }
}
