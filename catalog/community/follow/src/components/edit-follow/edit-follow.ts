import {Target, Name} from "../../shared/data";
import {GraphQlService} from "gql";

import {Widget} from "client-bus";


export interface SourceFollowInfo {
  name: Name;
  followed_by: boolean;
}

@Widget({ng2_providers: [GraphQlService]})
export class EditFollowComponent {
  targets: SourceFollowInfo[];
  source = {name: "", on_change: (x) => undefined};
  private _name: Name;

  constructor(private _graphQlService: GraphQlService) {}

  follow(target: Target) {
    console.log(`following ${target.name}`);
    this._graphQlService
      .post(`follow(source: "${this._name}", target: "${target.name}")`)
      .subscribe(res => undefined);
  }

  unfollow(target: Target) {
    console.log(`unfollowing ${target.name}`);
    this._graphQlService
      .post(`unfollow(source: "${this._name}", target: "${target.name}")`)
      .subscribe(res => undefined);
  }

  dvAfterInit() {
    const update_targets = () => {
      const name = this.source.name;
      if (!name) return;
      console.log("got name " + name);
      this._name = name;
      this._graphQlService
        .get(`
          targets {
            name,
            followed_by(name: "${this._name}")
          }
        `)
        .map(data => data.targets.filter(u => u.name !== this._name))
        .subscribe(targets => this.targets = targets);
    };

    update_targets();
    this.source.on_change(update_targets);
  }
}
