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
export class EditSubgroupsOfGroupComponent {
  @Field("Group") group: GroupAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failMsg = "";

  wrapId = uuidv4(); // Lets us find input in which to install typeahead
  nonSubgroups: Group[] = []; // all groups which are not a group subgroup
  stagedGroups: GroupAtom[] = []; // groups we want to have as a subgroup
  req: Promise<boolean> = null;

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
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

    this.submit_ok.on_change(() => {
      if (this.submit_ok.value === true && this.group.atom_id) {
        this.req = this.updateSubgroups();
      }
    });

    this.submit_ok.on_after_change(() => {
      if (this.req) {
        this.req.then(success => {
          // TODO: reset for next add
          this.failMsg = success ? "" : "Error when editing subgroups.";
          this.req = null;
        });
      }
    });
  }

  // queues a group for adding once submit_ok is true
  stageGroup(): void {
    const name = getTypeaheadVal(this.wrapId);
    const groupIdx = this.nonSubgroups.findIndex((m => m.name === name));
    if (groupIdx >= 0) {
      const group = this.nonSubgroups[groupIdx];
      this.nonSubgroups.splice(groupIdx, 1); // remove
      const g_atom = this._clientBus.new_atom<GroupAtom>("Group");
      g_atom.atom_id = group.atom_id;
      g_atom.name = group.name;
      this.stagedGroups.push(g_atom);
      setTypeaheadVal(this.wrapId, "");
      this.failMsg = "";
    } else {
      this.failMsg = "Group not found.";
    }
  }

  // dequeues a group for adding, or queue for removal upon submit_ok
  unstageGroup(atom_id: string): void {
    const groupIdx = this.stagedGroups.findIndex((g =>
      g.atom_id === atom_id
    ));
    if (groupIdx >= 0) {
      const group = this.nonSubgroups[groupIdx];
      this.stagedGroups.splice(groupIdx, 1); // remove
      this.nonSubgroups.push(group);
    }
  }

  // does the necessary adds and removals
  updateSubgroups(): Promise<boolean> {
    // add all groups in stagedGroups but not group.subgroups
    const adds = this.stagedGroups.filter(stagedG =>
      this.group.subgroups.find(groupG =>
        groupG.atom_id === stagedG.atom_id
      ) === undefined
    )
    .map(addG => this._groupService
      .addSubgroupToGroup(this.group.atom_id, addG.atom_id)
    );

    // remove all groups in group.subgroups but not stagedGroups
    const removes = this.group.subgroups.filter(groupG =>
      this.stagedGroups.find(stagedG =>
        stagedG.atom_id === groupG.atom_id
      ) === undefined
    )
    .map(removeG => this._groupService
      .removeSubgroupFromGroup(this.group.atom_id, removeG.atom_id)
    );

    return Promise.all(adds.concat(...removes))
      .then(arr => arr.indexOf(false) === -1);
  }

  // load group subgroups if this.group.subgroups is not populated
  // all groups in this.group.subgroups get staged
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
          this.group.subgroups.forEach(g => this.stagedGroups.push(g));
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
