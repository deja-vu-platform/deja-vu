import {Injectable} from 'angular2/core';
import {Http} from 'angular2/http';
import {User, Username} from '../user';

@Injectable()
export class FriendService {

  constructor(private _http: Http) {}

  getFriends(username: Username) {
    return this._http.get(
      `http://localhost:3000/api/users/${username}/friends`)
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
      `http://localhost:3000/api/users?not-friends-of=${username}`)
        .map(res => res.json());
  }
}
