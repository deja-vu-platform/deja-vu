import {Widget, Field} from "client-bus";
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
export class AddSubgroupToGroupComponent {
  @Field("Group") group: GroupAtom;

  failed = false; // Shows failure message on not found
  wrapId = uuidv4();

  private allGroups: Group[] = [];
  private nonSubgroups: Group[] = [];
  private fetched: string;


  constructor(
    private _groupService: GroupService,
    private _atomize: Atomize
  ) {}

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
        this.nonSubgroups = this.allGroups.slice();
        this.updateTypeahead();
      }
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
            return this._atomize.atomizeGroup(subgroup);
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
