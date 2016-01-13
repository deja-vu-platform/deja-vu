import {Injectable} from "angular2/core";
import {Http} from "angular2/http";
import {User, Username, Content} from "../data";

@Injectable()
export class PostService {
  private _api = "http://localhost:3000/api";

  constructor(private _http: Http) {}

  getPosts(username: Username) {
    return this._http.get(
      this._api + `/users/${username}/posts` + "?fields=content")
      .map(res => res.json());
  }

  newPost(username: Username, content: Content) {
    return this._http.post(
      this._api + `/users/${username}/posts`, content)
      .map(res => res.json());
  }
}
