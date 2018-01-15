import {GraphQlService} from "gql";

import {ClientBus, Widget, Field, PrimitiveAtom, WidgetValue} from "client-bus";
import {ProfileAtom} from "../shared/data";


@Widget({fqelement: "Profile", ng2_providers: [GraphQlService]})
export class CreateProfileWithRedirectComponent {
  @Field("Profile") profile: ProfileAtom;
  @Field("Widget") on_create_ok: PrimitiveAtom<WidgetValue>;

  username_error = false;

  constructor(
    private _graphQlService: GraphQlService,
    private _client_bus: ClientBus) {}

  onSubmit() {
    // clear previous error
    this.username_error = false;

    this._graphQlService
      .post(`
        createProfile(
          username: "${this.profile.username}",
          first_name: "${this.profile.first_name}",
          last_name: "${this.profile.last_name}",
          email: "${this.profile.email}",
          phone: "${this.profile.phone}",
          birthday: "${this.profile.birthday}"
        )
        {
          atom_id
        }
      `)
      .subscribe(atom_id => {
        this.profile.atom_id = atom_id;
        if (this.on_create_ok.value)
          this._client_bus.navigate(this.on_create_ok.value);
      },
      err => {
        this.username_error = true;
      });
  }
}
