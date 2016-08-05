/// <reference path="../../../typings/underscore/underscore.d.ts" />
import {Injectable, Inject} from "angular2/core";
import {Http, Headers} from "angular2/http";
import {Observable} from "rxjs/observable";

import * as _u from "underscore";


@Injectable()
export class GraphQlService {
  constructor(
    private _http: Http, @Inject("label.api") private _api: String) {}

  post(query) {
    const headers = new Headers();
    headers.append("Content-type", "application/json");
    const query_str = query.replace(/ /g, "");

    return this._http
      .post(
          this._api + "/graphql",
          JSON.stringify({query: "mutation " + query_str}),
          {headers: headers})
      .map(res => res.json());
  }

  get(query): Observable<any> {
    const query_str = query.replace(/ /g, "");
    return this._http
      .get(this._api + `/graphql?query=query+${query_str}`)
      .map(res => res.json())
      .map(json_res => json_res.data);
  }

  pobj(o: Object) {
    return "{" + _u
      .reduce(
          _u.keys(o), (memo, key: string) => memo + "," + key + ": " + o[key]) +
      "}";
  }

  plist(l: any[]) {
    return "[" + _u.reduce(l, (memo, i) => memo + "," + this.pobj(i)) + "]";
  }
}
