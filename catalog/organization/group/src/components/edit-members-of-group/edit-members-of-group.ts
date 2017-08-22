import {ViewChild, ElementRef} from "@angular/core";

import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import Atomize from "../_shared/atomize";
import {Member, MemberAtom, GroupAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";
import Typeahead from "../_shared/Typeahead";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService,
    Atomize
  ]
})
export class EditMembersOfGroupComponent {
  @Field("Group") group: GroupAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  @ViewChild("typeaheadWrapper") typeaheadWrapper: ElementRef;

  failMsg = "";
  typeahead: Typeahead;
  stagedMembers: MemberAtom[] = []; // members we want to have in the group

  private allMembers: Member[] = [];
  private nonMembers: Member[] = [];
  private req: Promise<boolean> = null;
  private fetched: string;

  constructor(
    private _groupService: GroupService,
    private _atomize: Atomize
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
    Typeahead.loadAPI()
      .then(() => this.typeahead = new Typeahead(this.typeaheadWrapper, []))
      .then(() => this._groupService.getMembers())
      .then((members: Member[]) => {
        this.allMembers = members;
        this.nonMembers = members.slice();
        this.updateTypeahead();
        this.fetch();
        this.group.on_change(() => this.fetch());
      });
  }

  // queues a member for adding once submit_ok is true
  stageMember(): void {
    const name = this.typeahead.getValue();
    const memberIdx = this.nonMembers.findIndex((m => m.name === name));
    if (memberIdx >= 0) {
      const member = this.nonMembers[memberIdx];
      this.nonMembers.splice(memberIdx, 1); // remove element
      this.stagedMembers.push(this._atomize.atomizeMember(member));
      this.typeahead.setValue("");
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
      this.stagedMembers.splice(memberIdx, 1); // remove element
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
    const adds = this.stagedMembers.filter(stagedMember =>
      this.group.members.find(groupMember =>
        groupMember.atom_id === stagedMember.atom_id
      ) === undefined
    )
    .map(addM => this._groupService
      .addMemberToGroup(this.group.atom_id, addM.atom_id)
    );

    // remove all members in group.members but not stagedMembers
    const removes = this.group.members.filter(groupMember =>
      this.stagedMembers.find(stagedMember =>
        stagedMember.atom_id === groupMember.atom_id
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
            return this._atomize.atomizeMember(member);
          });
          this.group.members.forEach(member => {
            this.stagedMembers.push(member);
          });
          return this.group.members;
        });
    } else {
      return Promise.resolve(this.group.members);
    }
  }

  // return array of all members in all goups and not in group subgroups
  private determineNonMembers(): Member[] {
    return this.allMembers.filter(anyMember =>
      this.group.members.find(groupMember =>
        groupMember.atom_id === anyMember.atom_id
      ) === undefined
    );
  }

  private updateTypeahead() {
    this.typeahead.updateData(this.nonMembers.map(member => {
      return member.name;
    }));
  }
}
