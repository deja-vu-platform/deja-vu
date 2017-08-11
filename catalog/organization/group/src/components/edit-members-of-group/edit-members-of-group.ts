import {Widget, Field, PrimitiveAtom, ClientBus} from "client-bus";
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
export class EditMembersOfGroupComponent {
  @Field("Group") group: GroupAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failMsg = "";
  wrapId = uuidv4(); // Lets us find input in which to install typeahead
  stagedMembers: MemberAtom[] = []; // members we want to have in the group

  private allMembers: Member[] = [];
  private nonMembers: Member[] = [];
  private req: Promise<boolean> = null;
  private fetched: string;

  constructor(
    private _groupService: GroupService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      if (this.submit_ok.value === true && this.group.atom_id) {
        this.req = this.updateMembers();
      }
    });

    this.submit_ok.on_after_change(() => {
      if (this.req) {
        this.req.then(success => {
          this.failMsg = success ? "" : "Error when editing members.";
          this.req = null;
        });
      }
    });
  }

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

  // queues a member for adding once submit_ok is true
  stageMember(): void {
    const name = getTypeaheadVal(this.wrapId);
    const memberIdx = this.nonMembers.findIndex((m => m.name === name));
    if (memberIdx >= 0) {
      const member = this.nonMembers[memberIdx];
      this.nonMembers.splice(memberIdx, 1); // remove
      const m_atom = this._clientBus.new_atom<MemberAtom>("Member");
      m_atom.atom_id = member.atom_id;
      m_atom.name = member.name;
      this.stagedMembers.push(m_atom);
      setTypeaheadVal(this.wrapId, "");
      this.failMsg = "";
    } else {
      this.failMsg = "Member not found.";
    }
  }

  // dequeues a member for adding, or queue for removal upon submit_ok
  unstageMember(atom_id: string): void {
    const memberIdx = this.stagedMembers.findIndex((m =>
      m.atom_id === atom_id
    ));
    if (memberIdx >= 0) {
      const member = this.nonMembers[memberIdx];
      this.stagedMembers.splice(memberIdx, 1); // remove
      this.nonMembers.push(member);
    }
  }

  private fetch() {
    if (this.fetched !== this.group.atom_id) {
      this.fetched = this.group.atom_id;
      this.group.members = [];
      if (this.group.atom_id) {
        this.getGroupMembers()
          .then(_ => this.determineNonMembers())
          .then(nonMembers => this.nonMembers = nonMembers)
          .then(_ => this.updateTypeahead());
      } else {
        this.stagedMembers = [];
        this.nonMembers = this.allMembers.slice();
        this.updateTypeahead();
      }
    }
  }

  // adds all members in membersToAdd (pushes to backend)
  private updateMembers(): Promise<boolean> {
    // add all members in stagedMembers but not group.members
    const adds = this.stagedMembers.filter(stagedM =>
      this.group.members.find(groupM =>
        groupM.atom_id === stagedM.atom_id
      ) === undefined
    )
    .map(addM => this._groupService
      .addMemberToGroup(this.group.atom_id, addM.atom_id)
    );

    // remove all members in group.members but not stagedMembers
    const removes = this.group.members.filter(groupM =>
      this.stagedMembers.find(stagedM =>
        stagedM.atom_id === groupM.atom_id
      ) === undefined
    )
    .map(removeM => this._groupService
      .removeMemberFromGroup(this.group.atom_id, removeM.atom_id)
    );

    return Promise.all(adds.concat(...removes))
      .then(arr => arr.indexOf(false) === -1);
  }

  // load group members if this.group.members is not populated
  // all members in this.group.members get staged
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
          this.group.members.forEach(m => this.stagedMembers.push(m));
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
