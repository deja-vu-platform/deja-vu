import {Widget, Field, PrimitiveAtom} from "client-bus";
import {ProfileAtom} from "../shared/data";
import {GraphQlService} from "gql";
import "rxjs/add/operator/map";

@Widget({
  fqelement: "Profile",
  ng2_providers: [ GraphQlService ]
})
export class EditProfilePhoneNumberComponent {
  @Field("Profile") profile: ProfileAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  edit_phone_error = false;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.profile.atom_id) {
      this.fetch();
    }

    this.submit_ok.on_change(() => {
      // reset error
      this.edit_phone_error = false;
      if (this.profile.atom_id && this.profile.phone) {
        this._graphQlService
          .post(`
            updateProfile(
              username: "${this.profile.atom_id}",
              phone: "${this.profile.phone}")
          `)
          .subscribe(success => {
            this.edit_phone_error = !success;
            this.profile.phone = "";
          });
      }
    });
  }

  private fetch() {
    this._graphQlService
      .get(`
        profile_by_id(atom_id: "${this.profile.atom_id}") {
          phone
        }
      `)
      .map(data => data.profile_by_id)
      .subscribe(profile => {
        this.profile.phone = profile.phone;
      });
  }
}
