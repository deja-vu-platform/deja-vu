import {Widget, Field, PrimitiveAtom, ClientBus} from "client-bus";
import {GraphQlService} from "gql";

import {Member, MemberAtom, GroupAtom} from "../_shared/data";
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
export class AddMemberToGroupComponent {
  @Field("Group") group: GroupAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failed = false; // Shows failure message on not found
  wrapId = uuidv4();
  nonMembers: Member[] = []; // all non-members

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (this.group.atom_id) {
      Promise
        .all([
          this.getGroupMembers(),
          this._groupService.getMembers()
        ])
        .then(arr => this.determineNonMembers(arr[1], arr[0]))
        .then(nonMembers => {
          this.nonMembers = nonMembers;
          addTypeahead(this.wrapId, nonMembers.map(m =>m.name));
        });
    }
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

  // return array of all members in allMembers and not in groupMembers
  private determineNonMembers(
    allMembers: Member[],
    groupMembers: Member[]
  ): Member[] {
    return allMembers.filter(anyM =>
      groupMembers.find(groupM =>
        groupM.atom_id === anyM.atom_id
      ) === undefined
    );
  }
}
