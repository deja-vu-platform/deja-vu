import {Widget, Field, ClientBus} from "client-bus";
import {GraphQlService} from "gql";

import {Member, MemberAtom, GroupAtom} from "../_shared/data";
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
    GroupService
  ]
})
export class AddMemberToGroupComponent {
  @Field("Group") group: GroupAtom;

  failed = false; // Shows failure message on not found
  wrapId = uuidv4();

  private allMembers: Member[] = [];
  private nonMembers: Member[] = [];
  private fetched: string;

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  ngAfterViewInit() {
    addTypeahead(this.wrapId, [])
      .then(() => this._groupService.getMembers())
      .then(members => {
        this.allMembers = members;
        this.nonMembers = members.slice();
        this.updateTypeahead();
        this.fetch();
        this.group.on_change(() => this.fetch());
      });
  }

  onSubmit() {
    if (this.group.atom_id) {
      const name = getTypeaheadVal(this.wrapId);
      const member = this.nonMembers.find((m => m.name === name));
      if (member === undefined) {
        this.failed = true;
      } else {
        this._groupService
          .addMemberToGroup(
            this.group.atom_id,
            member.atom_id
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
      this.group.members = [];
      if (this.group.atom_id) {
        this.getGroupMembers()
          .then(_ => this.determineNonMembers())
          .then(nonMembers => {
            this.nonMembers = nonMembers;
            this.updateTypeahead();
          });
      } else {
        this.nonMembers = this.allMembers.slice();
        this.updateTypeahead();
      }
    }
  }

  // load group members if this.group.members is not populated
  private getGroupMembers(): Promise<MemberAtom[]> {
    if (!this.group.members) {
      this.group.members = [];
    }
    if (this.group.atom_id && this.group.members.length === 0) {
      return this._groupService
        .getMembersOfGroup(this.group.atom_id)
        .then(members => {
          this.group.members = members.map(member => {
            const m_atom = this._clientBus.new_atom<MemberAtom>("Member");
            m_atom.atom_id = member.atom_id;
            m_atom.name = member.name;
            return m_atom;
          });
          return this.group.members;
        });
    } else {
      return Promise.resolve(this.group.members);
    }
  }

  // return array of all members in all goups and not in group subgroups
  private determineNonMembers(): Member[] {
    return this.allMembers.filter(anyM =>
      this.group.members.find(groupM =>
        groupM.atom_id === anyM.atom_id
      ) === undefined
    );
  }

  private updateTypeahead() {
    updateTypeaheadOptions(this.wrapId, this.nonMembers.map(m => m.name));
  }
}
