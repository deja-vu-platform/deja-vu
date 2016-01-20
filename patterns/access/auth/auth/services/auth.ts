import {Injectable} from "angular2/core";
import {Http, Headers} from "angular2/http";
import {User} from "../data";
import {Observable} from "rxjs/Observable";


@Injectable()
export class AuthService {
  private _www = "http://localhost:3000";
  private _headers;

  constructor(private _http: Http) {
    this._headers = new Headers();
    this._headers.append("Content-type", "application/json");
  }

  signIn(user: User) {
    return this._http.post(
      this._www + "/signin", JSON.stringify(user), {headers: this._headers})
      .map(res => res.json());
  }

  register(user: User) {
    return this._http.post(
      this._www + "/register", JSON.stringify(user), {headers: this._headers})
      .map(res => res.json());
  }
}
