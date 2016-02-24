import {Injectable, Inject} from "angular2/core";
import {Http, Headers} from "angular2/http";
import {Username, Post} from "../../shared/data";

@Injectable()
export class PostService {
  constructor(private _http: Http, @Inject("post.api") private _api: String) {}

  getPosts(username: Username) {
    return this._http.get(
      this._api + `/users/${username}/posts`)
      .map(res => res.json());
  }

  newPost(username: Username, post: Post) {
    const headers = new Headers();
    headers.append("Content-type", "application/json");
    return this._http.post(
      this._api + `/users/${username}/posts`, JSON.stringify(post), {
        headers: headers
      })
      .map(res => res.json());
  }
}
