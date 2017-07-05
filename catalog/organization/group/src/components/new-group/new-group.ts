import {Widget, Field, PrimitiveAtom} from "client-bus";

import {MemberAtom, GroupAtom} from "../../shared/data";


@Widget({fqelement: "Group"})
export class NewGroupComponent {
  @Field("Group") group: GroupAtom;
  @Field("Member") initialMember: MemberAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;
}
