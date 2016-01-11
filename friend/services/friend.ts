import {Injectable} from 'angular2/core';
import {Http} from 'angular2/http';
import {User, Username} from '../user';

@Injectable()
export class FriendService {
  private _api = "http://localhost:3000/api";

  constructor(private _http: Http) {}

  getFriends(username: Username) {
    return this._http.get(this._api + `/users/${username}/friends`)
      .map(res => res.json());
  }

  addFriend(u1: User, u2: User) {
    return {};
  }

  unfriend(u1: User, u2: User) {
    return {};
  }

  getPotentialFriends(username: Username) {
    return this._http.get(
        this._api + `/users?not-friends-of=${username}&fields=username,friends`)
        .map(res => res.json());
  }
}
