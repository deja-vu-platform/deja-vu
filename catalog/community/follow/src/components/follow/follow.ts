import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";
import {Observable} from "rxjs/observable";

import {Target, Name} from "../../shared/data";
import {GraphQlService} from "../shared/graphql";


@Component({
  selector: "follow",
  templateUrl: "./components/follow/follow.html",
  providers: [GraphQlService, HTTP_PROVIDERS],
  inputs: ["name"]
})
export class FollowComponent {
  potentialFollows: Target[];
  private _name: Name;

  constructor(private _graphQlService: GraphQlService) {}

  follow(target: Target) {
    console.log(`following ${target.name}`);
    this._follow(this._name, target.name).subscribe(res => undefined);
  }

  get name() {
    return this._name;
  }

  set name(name: Name) {
    if (!name) return;
    console.log("got name " + name);
    this._name = name;
    this._getPotentialFollows(this._name).subscribe(
        potentialFollows => this.potentialFollows = potentialFollows);
  }

  private _getPotentialFollows(source: Name): Observable<Target[]> {
    return this._graphQlService.get(`{
      source(name: "${source}") {
        name,
        potentialFollows {
          name
        } 
      }
    }`).map(data => data.source.potentialFollows);
  }

  private _follow(source: Name, target: Name): any {
    return this._graphQlService.post(`{
      follow(source: "${source}", target: "${target}")
    }`);
  }
}
