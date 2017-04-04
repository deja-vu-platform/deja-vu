import {Target, Name} from "../../shared/data";
import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({fqelement: "Follow", ng2_providers: [GraphQlService]})
export class FollowComponent {
  potentialFollows: Target[];
  private _name: Name;

  constructor(private _graphQlService: GraphQlService) {}

  follow(target: Target) {
    console.log(`following ${target.name}`);
    this._graphQlService
      .post(`follow(source: "${this._name}", target: "${target.name}")`)
      .subscribe(res => undefined);
  }

  get name() {
    return this._name;
  }

  set name(name: Name) {
    if (!name) return;
    console.log("got name " + name);
    this._name = name;
    this._graphQlService
      .get(`
        source(name: "${this._name}") {
          potentialFollows {
            name
          } 
        }
      `)
      .map(data => data.source.potentialFollows)
      .subscribe(potentialFollows => this.potentialFollows = potentialFollows);
  }
}
