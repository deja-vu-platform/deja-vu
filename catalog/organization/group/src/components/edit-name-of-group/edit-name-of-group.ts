import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {GroupAtom} from "../_shared/data";
import GroupService from "../_shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class EditNameOfGroupComponent {
  @Field("Group") group: GroupAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failMsg: string;
  private fetched: string;

  constructor(private _groupService: GroupService) {}

  dvAfterInit() {
    if (this.group.atom_id && !this.group.name) {
      this.fetch();
    } else {
      this.fetched = this.group.atom_id;
    }

    this.group.on_change(() => this.fetch());

    this.submit_ok.on_change(() => {
      if (
        this.submit_ok.value &&
        this.group.atom_id &&
        this.group.name
      ) {
        return this._groupService
          .updateNameOfGroup(
            this.group.atom_id,
            this.group.name
          )
          .then(success => {
            this.failMsg = success ? "" : "Failed to update group name.";
          });
      }
    });

    this.submit_ok.on_after_change(() => {
      this.group.name = "";
    });
  }

  private fetch() {
    if (this.fetched !== this.group.atom_id) {
      this.fetched = this.group.atom_id;
      if (this.group.atom_id) {
        this.getName();
      } else {
        this.group.name = "";
      }
    }
  }

  private getName() {
    this._groupService
      .getNameOfGroup(this.group.atom_id)
      .then(name => this.group.name = name);
  }
}
