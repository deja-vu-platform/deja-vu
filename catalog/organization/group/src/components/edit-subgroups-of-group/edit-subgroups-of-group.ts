import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import Atomize from "../_shared/atomize";
import {Group, GroupAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";
import {
  addTypeahead,
  uuidv4,
  getTypeaheadVal,
  setTypeaheadVal,
  updateTypeaheadOptions
} from "../_shared/utils";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService,
    Atomize
  ]
})
export class EditSubgroupsOfGroupComponent {
  @Field("Group") group: GroupAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failMsg = "";
  wrapId = uuidv4(); // Lets us find input in which to install typeahead
  stagedGroups: GroupAtom[] = []; // groups we want to have as a subgroup

  private allGroups: Group[] = [];
  private nonSubgroups: Group[] = [];
  private req: Promise<boolean> = null;
  private fetched: string;


  constructor(
    private _groupService: GroupService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      if (this.submit_ok.value === true && this.group.atom_id) {
        this.req = this.updateSubgroups();
      }
    });

    this.submit_ok.on_after_change(() => {
      if (this.req) {
        this.req.then(success => {
          this.failMsg = success ? "" : "Error when editing subgroups.";
          this.req = null;
        });
      }
    });
  }

  ngAfterViewInit() {
    addTypeahead(this.wrapId, [])
      .then(() => this._groupService.getGroups())
      .then(groups => {
        this.allGroups = groups;
        this.nonSubgroups = groups.slice();
        this.updateTypeahead();
        this.fetch();
        this.group.on_change(() => this.fetch());
      });
  }

  // queues a group for adding once submit_ok is true
  stageGroup(): void {
    const name = getTypeaheadVal(this.wrapId);
    const groupIdx = this.nonSubgroups.findIndex((m => m.name === name));
    if (groupIdx >= 0) {
      const group = this.nonSubgroups[groupIdx];
      this.nonSubgroups.splice(groupIdx, 1); // remove element
      this.stagedGroups.push(this._atomize.atomizeGroup(group));
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
      this.stagedGroups.splice(groupIdx, 1); // remove element
      this.nonSubgroups.push(group);
    }
  }

  private fetch() {
    if (this.fetched !== this.group.atom_id) {
      this.fetched = this.group.atom_id;
      this.group.subgroups = [];
      if (this.group.atom_id) {
        this.getGroupSubgroups()
          .then(_ => this.determineNonSubgroups())
          .then(nonSubgroups => {
            this.nonSubgroups = nonSubgroups;
            this.updateTypeahead();
          });
      } else {
        this.stagedGroups = [];
        this.updateTypeahead();
      }
    }
  }

  // does the necessary adds and removals
  private updateSubgroups(): Promise<boolean> {
    // add all groups in stagedGroups but not group.subgroups
    const adds = this.stagedGroups.filter(stagedGroup =>
      this.group.subgroups.find(groupSubgroup =>
        groupSubgroup.atom_id === stagedGroup.atom_id
      ) === undefined
    )
    .map(addG => this._groupService
      .addSubgroupToGroup(this.group.atom_id, addG.atom_id)
    );

    // remove all groups in group.subgroups but not stagedGroups
    const removes = this.group.subgroups.filter(groupSubgroup =>
      this.stagedGroups.find(stagedGroup =>
        stagedGroup.atom_id === groupSubgroup.atom_id
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
            return this._atomize.atomizeGroup(subgroup);
          });
          this.group.subgroups.forEach(subgroup => {
            this.stagedGroups.push(subgroup);
          });
          return this.group.subgroups;
        });
    } else {
      return Promise.resolve(this.group.subgroups);
    }
  }

  // return array of all subgroups in all goups and not in group subgroups
  private determineNonSubgroups(): Group[] {
    return this.allGroups.filter(anyGroup =>
      this.group.subgroups.find(groupSubgroup =>
        groupSubgroup.atom_id === anyGroup.atom_id
      ) === undefined
    );
  }

  private updateTypeahead() {
    updateTypeaheadOptions(this.wrapId, this.nonSubgroups.map(g => g.name));
  }
}
