import {Injectable} from "angular2/core";
import {Http} from "angular2/http";
import {Observable} from "rxjs/observable";
import {User, Username} from "../../shared/user";

@Injectable()
export class FriendService {
  constructor(private _http: Http) {}

  getFriends(username: Username): Observable<User[]> {
    return this._http.get(
      `/users/${username}/friends` + "?fields=username,friends")
      .map(res => res.json());
  }

  addFriend(u1: Username, u2: Username): any {
    return this._http.put(`/users/${u1}/friends/${u2}`, "")
      .map(res => res.json());
  }

  unfriend(u1: Username, u2: Username): any {
    return this._http.delete(`/users/${u1}/friends/${u2}`)
      .map(res => res.json());
  }

  getPotentialFriends(username: Username): Observable<User[]> {
    return this._http.get(
      `/users/${username}/potential_friends` + "?fields=username,friends")
      .map(res => res.json());
  }
}
