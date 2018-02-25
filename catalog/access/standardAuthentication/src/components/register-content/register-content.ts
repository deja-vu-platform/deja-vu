import { GraphQlService } from "gql";
import { Widget, ClientBus, Field, PrimitiveAtom } from "client-bus";
import { UserAtom } from "../shared/data";

@Widget({ fqelement: "StandardAuthentication",
          ng2_providers: [GraphQlService] })
export class RegisterContentComponent {
    @Field("User") user: UserAtom;
    @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

    reenter_password = "";
    username_error = false;
    reenter_password_error = false;

    constructor(
        private _graphQlService: GraphQlService,
        private _client_bus: ClientBus) { }

    dvAfterInit() {
        this.submit_ok.on_change(() => {
            this._registerUser();
        });

        this.submit_ok.on_after_change(() => {
            this.user.username = "";
            this.user.password = "";
            this.reenter_password = "";
        });
    }

    _registerUser() {
        this.reenter_password_error =
            (this.reenter_password !== this.user.password);
        if (this.reenter_password_error) return;

        console.log(this.user.username, this.user.password);

        this._graphQlService
            .post(`
                register(
                    username: "${this.user.username}",
                    password: "${this.user.password}")
                `)
            .subscribe(
                _ => {
                    this.user.username = "";
                    this.user.password = "";
                    this.reenter_password = "";
                 },
                err => {
                    this.username_error = true;
                }
            );
    }
}
