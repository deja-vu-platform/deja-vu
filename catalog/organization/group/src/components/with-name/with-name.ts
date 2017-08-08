import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {NamedAtom} from "../../shared/data";
import GroupService from "../../shared/group.service";


@Widget({
  fqelement: "Group",
  ng2_providers: [
    GraphQlService,
    GroupService
  ]
})
export class WithNameComponent {
  @Field("Group | Subgroup | Member") named: NamedAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  req: Promise<boolean> = null;

  constructor(private _groupService: GroupService) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      if (
        this.submit_ok.value === true &&
        this.named.atom_id &&
        this.named.name
      ) {
        this.req = this._groupService.updateName(
          this.named.atom_id,
          this.named.name
        );
      }
    });

    this.submit_ok.on_after_change(() => {
      if (this.req) this.req.then(success => {
        this.named.name = "";
        this.req = null;
      });
    });
  }
}
