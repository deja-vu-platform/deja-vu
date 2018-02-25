import { Widget, Field, AfterInit } from "client-bus";

import { UserAtom } from "../shared/data";

@Widget({ fqelement: "StandardAuthentication", template: "" })
export class GuestLoggedInComponent implements AfterInit {
    @Field("User") user: UserAtom;

    dvAfterInit() {
        this.user.username = localStorage.getItem("guest_username");
        this.user.atom_id = localStorage.getItem("guest_atom_id");
    }
}
