import "rxjs/add/operator/toPromise";

import {Target} from "../../shared/data";
import {SourceAtom} from "../shared/data";
import {GraphQlService} from "gql";

import {Widget, AfterInit, Field} from "client-bus";


export interface SourceFollowInfo { name: string; followed_by: boolean; }

@Widget({fqelement: "Follow", ng2_providers: [GraphQlService]})
export class EditFollowComponent implements AfterInit {
  @Field("Source") source: SourceAtom;

  targets: SourceFollowInfo[];
  private _name: string;

  constructor(private _graphQlService: GraphQlService) {}

  follow(target: Target) {
    this._graphQlService
      .post(`follow(source: "${this._name}", target: "${target.name}")`)
      .subscribe(res => undefined);
  }

  unfollow(target: Target) {
    this._graphQlService
      .post(`unfollow(source: "${this._name}", target: "${target.name}")`)
      .subscribe(res => undefined);
  }

  dvAfterInit() {
    const update_targets = () => {
      const name = this.source.name;
      if (!name) return;
      this._name = name;
      return this._graphQlService
        .get(`
          targets {
            name,
            followed_by(name: "${this._name}")
          }
        `)
        .toPromise()
        .then(data => data.targets.filter(u => u.name !== this._name))
        .then(targets => this.targets = targets);
    };

    update_targets();
    this.source.on_change(update_targets);
  }
}
