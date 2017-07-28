import {Widget, AfterInit, Field, ClientBus} from "client-bus";

import {GraphQlService} from "gql";
import "rxjs/add/operator/toPromise";

import {TargetAtom, SourceAtom} from "../../shared/data";


@Widget({
  fqelement: "Follow",
  ng2_providers: [GraphQlService]
})
export class EditFollowComponent implements AfterInit {
  @Field("Source") source: SourceAtom;
  targets: TargetAtom[] = [];

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (!this.source.follows) {
      this.source.follows = [];
    }
    this._graphQlService
      .get(`
        target_all {
          atom_id,
          name,
          followedBy(source_id: "${this.source.atom_id}")
        }
      `)
      .toPromise()
      .then(data => data.target_all.forEach(t => {
        const target_atom = this._clientBus.new_atom<TargetAtom>("Target");
        target_atom.atom_id = t.atom_id;
        target_atom.name = t.name;
        this.targets.push(target_atom);
        if (t.followedBy) {
          this.source.follows.push(target_atom);
        }
      }));
  }
}
