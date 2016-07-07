import {Injectable, Inject} from "angular2/core";
import {Http, Headers} from "angular2/http";

import {User} from "../../shared/data";


@Injectable()
export class AuthService {
  constructor(private _http: Http, @Inject("auth.api") private _api: String) {}

  signIn(user: User): any {
    return this._post("signIn", user);
  }

  register(user: User): any {
    return this._post("register", user);
  }

  private _post(mutation, {username, password}) {
    const headers = new Headers();
    headers.append("Content-type", "application/json");
    const query = `{
      ${mutation}(username: "${username}", password: "${password}")
    }`;
    const query_str = query.replace(/ /g, "");

    return this._http
      .post(
          this._api + "/graphql",
          JSON.stringify({query: "mutation " + query_str}),
          {headers: headers})
      .map(res => res.json());
  }
}
