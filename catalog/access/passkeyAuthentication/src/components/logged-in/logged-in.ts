import { Widget, Field, AfterInit } from "client-bus";

import { PasskeyAtom } from "../shared/data";

@Widget({ fqelement: "PasskeyAuthentication", template: "" })
export class LoggedInComponent implements AfterInit {
    @Field("Passkey") passkey: PasskeyAtom;

    dvAfterInit() {
        this.passkey.atom_id = localStorage.getItem("atom_id");
    }
}
