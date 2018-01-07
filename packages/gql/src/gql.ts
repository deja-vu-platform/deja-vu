import {Injectable, Inject} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs/Observable";

import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
// import "rxjs/add/operator/let";

import * as _u from "underscore";


interface GraphQlResponse {
  data: any;
  errors: any[];
}


@Injectable()
export class GraphQlService {
  private _api: string;

  constructor(
    private _http: HttpClient, @Inject("fqelement") fqelement,
    @Inject("locs") private _locs) {
    this._api = _locs[fqelement];
  }

  reset_fqelement(new_fqelement: string) {
    this._api = this._locs[new_fqelement];
  }

  post<T>(query): Observable<T> {
    const headers = new HttpHeaders();
    headers.append("Content-type", "application/json");

    return this._gql_map<T>(this._http
      .post<GraphQlResponse>(
          this._api + "/graphql",
          JSON.stringify({"query": "mutation {" + query + "}"}),
          {headers: headers}));
     // .let(this._gql_map);

  }

  get<T>(query): Observable<T> {
    return this._gql_map<T>(this._http
      .get<GraphQlResponse>(this._api + `/graphql?query=query+{${query}}`));
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

  list(l: string[]) {
    return "[\"" + l.join("\", \"") + "\"]";
  }

  private _gql_map<T>(obs: Observable<GraphQlResponse>): Observable<T> {
    return obs
      .map((json_res: GraphQlResponse) => {
        if (json_res.errors !== undefined) {
          throw new Error(json_res.errors[0].message);
        }
        return json_res.data;
      });
  }
}
