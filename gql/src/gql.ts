/// <reference path="../typings/tsd.d.ts" />
import {Injectable, Inject} from "angular2/core";
import {Http, Headers} from "angular2/http";
import {Observable} from "rxjs/observable";

import "rxjs/add/operator/map";

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

    return this._http
      .post(
          this._api + "/graphql",
          JSON.stringify({query: "mutation {" + query_str + "}"}),
          {headers: headers})
      .map(res => res.json())
      .map(json_res => json_res.data);
  }

  get(query): Observable<any> {
    const query_str = query.replace(/ /g, "");
    return this._http
      .get(this._api + `/graphql?query=query+{${query_str}}`)
      .map(res => res.json())
      .map(json_res => json_res.data);
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
}
