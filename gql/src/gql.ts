/// <reference path="../typings/tsd.d.ts" />
import {Injectable, Inject} from "angular2/core";
import {Http, Headers} from "angular2/http";
import {Observable} from "rxjs/Rx";

import "rxjs/add/operator/map";
// import "rxjs/add/operator/let";

import * as _u from "underscore";


@Injectable()
export class GraphQlService {
  private _api: string;

  constructor(
    private _http: Http, @Inject("fqelement") fqelement,
    @Inject("locs") locs) {
    this._api = locs[fqelement];
  }

  post(query): Observable<any> {
    const headers = new Headers();
    headers.append("Content-type", "application/json");
    const query_str = query.replace(/ /g, "");

    return this._gql_map(this._http
      .post(
          this._api + "/graphql",
          JSON.stringify({query: "mutation {" + query_str + "}"}),
          {headers: headers}));
     // .let(this._gql_map);

  }

  get(query): Observable<any> {
    const query_str = query.replace(/ /g, "");
    return this._gql_map(this._http
      .get(this._api + `/graphql?query=query+{${query_str}}`));
      // .let(this._gql_map);
  }

  pobj(o: Object) {
    return "{" + _u
      .map(
          _u.filter(_u.keys(o), k => !k.startsWith("_")),
          k => k + ": \"" + o[k] + "\"")
      .join(", ") + "}";
  }

  plist(l: any[]) {
    return "[" + _u.map(l, i => this.pobj(i)).join(", ") + "]";
  }

  _gql_map(obs: Observable<any>) {
    return obs
      .map(res => res.json())
      .map(json_res => {
        if (json_res.errors !== undefined) {
          throw new Error(json_res.errors[0].message);
        }
        return json_res.data;
      });
  }
}
