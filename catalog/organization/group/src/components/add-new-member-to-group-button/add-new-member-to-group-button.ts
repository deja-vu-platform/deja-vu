import { Widget, Field, PrimitiveAtom} from "client-bus";
import { GraphQlService } from "gql";

import { MemberAtom, GroupAtom } from "../_shared/data";
import GroupService from "../_shared/group.service";


@Widget({
    fqelement: "Group",
    ng2_providers: [
        GraphQlService,
        GroupService
    ]
})
export class AddNewMemberToGroupButtonComponent {
    @Field("Group") group: GroupAtom;
    @Field("Member") member: MemberAtom;
    @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

    failMsg: string;

    constructor(private _groupService: GroupService) { }

    submit() {
        this._groupService.createMember(this.member.name)
            .then(atom_id => {
                if (atom_id && this.group.atom_id) {
                    this.member.atom_id = atom_id;
                    this._groupService.addMemberToGroup(
                        this.group.atom_id,
                        this.member.atom_id
                    ).then(hasMemberBeenAdded => {
                        if (hasMemberBeenAdded) {
                            this.submit_ok.value = true;
                            this.failMsg = "";
                        } else {
                            this.failMsg = "Failed to create member.";
                        }
                    });
                } else {
                    this.failMsg = "Failed to create member.";
                }
            });
    }
}
