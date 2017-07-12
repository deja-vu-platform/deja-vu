import {Widget, Field} from "client-bus";

import {MemberAtom} from "../../shared/data";


@Widget({fqelement: "Group", template: `{{member.name}}`})
export class ShowMemberComponent {
  @Field("Member") member: MemberAtom;
}
