import { Widget, Field, PrimitiveAtom } from "client-bus";
import { GraphQlService } from "gql";

import { GroupAtom } from "../_shared/data";
import GroupService from "../_shared/group.service";


@Widget({
    fqelement: "Group",
    ng2_providers: [
        GraphQlService,
        GroupService
    ],
    template: ""
})
export class NewGroupWithoutButtonComponent {
    @Field("Group") group: GroupAtom;
    @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

    failMsg: string;

    constructor(private _groupService: GroupService) { }

    dvAfterInit() {
        this.submit_ok.on_change(() => {
            this._createNewGroup();
            this.group.atom_id = "";
        });
    }

    _createNewGroup() {
        this._groupService.createGroup()
            .then(atom_id => {
                if (atom_id) {
                    this.group.atom_id = atom_id;
                    this.failMsg = "";
                } else {
                    this.failMsg = "Failed to create group.";
                }
            });
    }
}
