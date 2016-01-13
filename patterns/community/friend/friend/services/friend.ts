import {Injectable} from "angular2/core";
import {Http} from "angular2/http";
import {User, Username} from "../user";

@Injectable()
export class FriendService {
  private _api = "http://localhost:3000/api";

  constructor(private _http: Http) {}

  getFriends(username: Username) {
    return this._http.get(
      this._api + `/users/${username}/friends` + "?fields=username,friends")
      .map(res => res.json());
  }

  addFriend(u1: Username, u2: Username) {
    return this._http.put(this._api + `/users/${u1}/friends/${u2}`, "")
      .map(res => res.json());
  }

  unfriend(u1: Username, u2: Username) {
    return this._http.delete(this._api + `/users/${u1}/friends/${u2}`)
      .map(res => res.json());
  }

  getPotentialFriends(username: Username) {
    return this._http.get(
      this._api + `/users/${username}/potential_friends` +
      "?fields=username,friends")
      .map(res => res.json());
  }
}
