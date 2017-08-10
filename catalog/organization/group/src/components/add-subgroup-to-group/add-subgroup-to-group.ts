import {Widget, Field, PrimitiveAtom, ClientBus} from "client-bus";
import {GraphQlService} from "gql";

import {Group, GroupAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";
import {
  addTypeahead,
  uuidv4,
  getTypeaheadVal,
  setTypeaheadVal
} from "../_shared/utils";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class AddSubgroupToGroupComponent {
  @Field("Group") group: GroupAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failed = false; // Shows failure message on not found
  wrapId = uuidv4();
  nonSubgroups: Group[] = []; // all non-subgroups

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (this.group.atom_id) {
      Promise
        .all([
          this.getGroupSubgroups(),
          this._groupService.getGroups()
        ])
        .then(arr => this.determineNonSubgroups(arr[1], arr[0]))
        .then(nonSubgroups => {
          this.nonSubgroups = nonSubgroups;
          addTypeahead(this.wrapId, nonSubgroups.map(g => g.name));
        });
    }
  }

  onSubmit() {
    if (this.group.atom_id) {
      const name = getTypeaheadVal(this.wrapId);
      const group = this.nonSubgroups.find((g => g.name === name));
      if (group === undefined) {
        this.failed = true;
      } else {
        this._groupService
          .addSubgroupToGroup(
            this.group.atom_id,
            group.atom_id
          )
          .then(success => {
            if (success) setTypeaheadVal(this.wrapId, "");
          });
      }
    } else {
      this.failed = true;
    }
  }

  // load group subgroups if this.group.subgroups is not populated
  private getGroupSubgroups(): Promise<GroupAtom[]> {
    if (!this.group.subgroups) {
      this.group.subgroups = [];
    }
    if (this.group.atom_id && this.group.subgroups.length === 0) {
      return this._groupService
        .getSubgroupsOfGroup(this.group.atom_id)
        .then(subgroups => {
          this.group.subgroups = subgroups.map(subgroup => {
            const g_atom = this._clientBus.new_atom<GroupAtom>("Group");
            g_atom.atom_id = subgroup.atom_id;
            g_atom.name = subgroup.name;
            return g_atom;
          });
          return this.group.subgroups;
        });
    } else {
      return Promise.resolve(this.group.subgroups);
    }
  }

  // return array of all subgroups in allGroups and not in groupSubgroups
  private determineNonSubgroups(
    allGroups: Group[],
    groupSubgroups: Group[]
  ): Group[] {
    return allGroups.filter(anyG =>
      groupSubgroups.find(groupG =>
        groupG.atom_id === anyG.atom_id
      ) === undefined
    );
  }
}
