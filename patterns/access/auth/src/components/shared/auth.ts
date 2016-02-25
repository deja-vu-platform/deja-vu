import {Injectable, Inject} from "angular2/core";
import {Http, Headers} from "angular2/http";

import {User} from "../../shared/data";


@Injectable()
export class AuthService {
  private _headers;

  constructor(private _http: Http, @Inject("auth.api") private _api: String) {
    this._headers = new Headers();
    this._headers.append("Content-type", "application/json");
  }

  signIn(user: User): any {
    return this._http.post(
      this._api + "/signin", JSON.stringify(user), {headers: this._headers})
      .map(res => res.json());
  }

  register(user: User): any {
    return this._http.post(
      this._api + "/register", JSON.stringify(user), {headers: this._headers})
      .map(res => res.json());
  }
}
