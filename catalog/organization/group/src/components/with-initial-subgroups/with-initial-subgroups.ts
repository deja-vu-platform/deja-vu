import {ElementRef} from "@angular/core";

import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {Named, ParentAtom} from "../../shared/data";
import {
  addTypeahead,
  uuidv4,
  getTypeaheadVal,
  setTypeaheadVal
} from "../../shared/utils";
import {
  getNonSubgroupsByParent,
  addSubgroupToParent
} from "../../shared/services";


@Widget({
  fqelement: "Group",
  ng2_providers: [GraphQlService]
})
export class WithInitialSubgroupsComponent {
  @Field("Group | Subgroup") parent: ParentAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failed = false; // Shows failure message on not found
  wrapId = uuidv4(); // Lets us find input in which to install typeahead
  options: Named[] = []; // all non-subgroups not in the group
  subgroupsToAdd: Named[] = []; // subgroups we want to add to the group

  constructor(
    private _graphQlService: GraphQlService,
    private _elementRef: ElementRef
  ) {}

  dvAfterInit() {
    if (this.parent.atom_id) {
      getNonSubgroupsByParent(this._graphQlService, this.parent.atom_id)
        .then(nonSubgroups => {
          this.options = nonSubgroups;
          addTypeahead(this.wrapId, this.options.map(m => {
            return m.name;
          }));
        });
    }

    this.submit_ok.on_change(() => this.addSubgroups());
  }

  // queues a subgroup for adding once submit_ok is true
  queueSubgroupAdd(): void {
    const name = getTypeaheadVal(this.wrapId);
    const subgroupIdx = this.options.findIndex((m => m.name === name));
    const subgroup = this.options[subgroupIdx];
    if (subgroupIdx >= 0) {
      this.options.splice(subgroupIdx, 1); // remove
      this.subgroupsToAdd.push(subgroup);
      setTypeaheadVal(this.wrapId, "");
      this.failed = false;
    } else {
      this.failed = true;
    }
  }

  // adds all subgroups in subgroupsToAdd (pushes to backend)
  addSubgroups() {
    Promise
      .all(this.subgroupsToAdd.map(m => {
        return addSubgroupToParent(
          this._graphQlService,
          this.parent.atom_id,
          m.atom_id
        );
      }))
      .then(_ => this.subgroupsToAdd = []);
  }
}
