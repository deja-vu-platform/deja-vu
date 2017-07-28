import {Widget, Field, AfterInit, ClientBus} from "client-bus";

import {GraphQlService} from "gql";
import "rxjs/add/operator/toPromise";

import {TargetAtom, SourceAtom} from "../../shared/data";
import {doesFollow} from "../../shared/utils";


@Widget({
  fqelement: "Follow",
  ng2_providers: [GraphQlService]
})
export class FollowUnfollowComponent implements AfterInit {
  @Field("Target") target: TargetAtom;
  @Field("Source") source: SourceAtom;

  _lastID: string = "";

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    const getFollows = () => this._graphQlService
      .get(`
        source_by_id(atom_id: "${this.source.atom_id}") {
          follows {
            atom_id
          }
        }
      `)
      .toPromise()
      .then(res => {
        res.source_by_id.follows.forEach(t => {
          const t_atom = this._clientBus.new_atom<TargetAtom>("Target");
          t_atom.atom_id = t.atom_id;
          this.source.follows.push(t_atom);
        });
      });

    if (!this.source.follows) {
      this.source.follows = [];
    }
    if (this.source.follows.length === 0 && this.source.atom_id) {
      getFollows();
    }
    if (this.source.atom_id) {
      this._lastID = this.source.atom_id;
    }
    this.source.on_change(() => {
      if (this._lastID !== this.source.atom_id) {
        this._lastID = this.source.atom_id;
        return getFollows();
      }
    });
  }

  follow() {
    this._graphQlService
      .post(`
        follow(
          source_id: "${this.source.atom_id}",
          target_id: "${this.target.atom_id}"
        )
      `)
      .subscribe(res => {
        if (res) {
          this.source.follows.push(this.target);
        }
      });
  }

  unfollow() {
    this._graphQlService
      .post(`
        unfollow(
          source_id: "${this.source.atom_id}",
          target_id: "${this.target.atom_id}"
        )
      `)
      .subscribe(res => {
        if (res) {
          filterInPlace(this.source.follows, (t) => {
             return t.atom_id !== this.target.atom_id;
          });
        }
      });
  }

  doesFollow(source: SourceAtom, target: TargetAtom): boolean {
    return doesFollow(source, target);
  }
}

function filterInPlace<T>(arr: T[], f: (elm: T) => boolean): T[] {
  let out = 0;
  for (let i = 0; i < arr.length; i++) {
    if (f(arr[i])) {
      arr[out++] = arr[i];
    }
  }
  arr.length = out;
  return arr;
}
