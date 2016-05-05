import {Injectable, Inject} from "angular2/core";
import {Http, Headers} from "angular2/http";
import {Observable} from "rxjs/observable";

import {Username, Post} from "../../shared/data";


@Injectable()
export class PostService {
  constructor(private _http: Http, @Inject("post.api") private _api: String) {}

  getPosts(username: Username): Observable<Post[]> {
    return this._get(`{
      user(username: "${username}") {
        posts {
          content
        }
      }
    }`)
      .map(user => user.posts);
  }

  newPost(author: Username, content): any {
    return this._post(`{
      newPost(author: "${author}", content: "${content}")
    }`);
  }

  private _post(query) {
    const headers = new Headers();
    headers.append("Content-type", "application/json");
    const query_str = query.replace(/ /g, "");

    return this._http
      .post(
          this._api + "/graphql",
          JSON.stringify({query: "mutation " + query_str}),
          {headers: headers})
      .map(res => res.json())
      .map(json_res => json_res.data);
  }

  private _get(query) {
    const query_str = query.replace(/ /g, "");
    return this._http
      .get(this._api + `/graphql?query=query+${query_str}`)
      .map(res => res.json())
      .map(json_res => json_res.data.user);
  }
}
