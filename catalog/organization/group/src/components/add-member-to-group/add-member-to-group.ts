import {ViewChild, ElementRef} from "@angular/core";

import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import Atomize from "../_shared/atomize";
import {Member, MemberAtom, GroupAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";
import Typeahead from "../_shared/typeahead";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService,
    Atomize
  ]
})
export class AddMemberToGroupComponent {
  @Field("Group") group: GroupAtom;

  @ViewChild("typeaheadWrapper") typeaheadWrapper: ElementRef;

  failed = false; // Shows failure message on not found
  typeahead: Typeahead;

  private allMembers: Member[] = [];
  private nonMembers: Member[] = [];
  private fetched: string;


  constructor(
    private _groupService: GroupService,
    private _atomize: Atomize
  ) {}

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

  onSubmit() {
    if (this.group.atom_id) {
      const name = this.typeahead.getValue();
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
            if (success) this.typeahead.setValue("");
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
            return this._atomize.atomizeMember(member);
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
