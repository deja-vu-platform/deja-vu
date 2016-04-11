import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";
import {Observable} from "rxjs/observable";

import {Target, Name} from "../../shared/data";
import {GraphQlService} from "../shared/graphql";


export interface SourceFollowInfo {
  name: Name;
  followed_by: boolean;
}

@Component({
  selector: "edit-follow",
  templateUrl: "./components/edit-follow/edit-follow.html",
  providers: [GraphQlService, HTTP_PROVIDERS],
  inputs: ["name"]
})
export class EditFollowComponent {
  targets: SourceFollowInfo[];
  private _name: Name;

  constructor(private _graphQlService: GraphQlService) {}

  follow(target: Target) {
    console.log(`following ${target.name}`);
    this._follow(this._name, target.name).subscribe(res => undefined);
  }

  unfollow(target: Target) {
    console.log(`unfollowing ${target.name}`);
    this._unfollow(this._name, target.name).subscribe(res => undefined);
  }

  get name() {
    return this._name;
  }

  set name(name: Name) {
    if (!name) return;
    console.log("got name " + name);
    this._name = name;
    this._getTargetsWithFollowInfo(this._name).subscribe(
        targets => this.targets = targets);
  }

  private _getTargetsWithFollowInfo(
      source: Name): Observable<SourceFollowInfo[]> {
    return this._graphQlService.get(`{
      targets {
        name,
        followed_by(name: "${source}")
      }
    }`).map(data => data.targets.filter(u => u.name !== this._name));
  }

  private _follow(source: Name, target: Name): any {
    return this._graphQlService.post(`{
      follow(source: "${source}", target: "${target}")
    }`);
  }

  private _unfollow(source: Name, target: Name): any {
    return this._graphQlService.post(`{
      unfollow(source: "${source}", target: "${target}")
    }`);
  }
}
