import {Widget, Field, PrimitiveAtom} from "client-bus";
import {ProfileAtom} from "../shared/data";
import {GraphQlService} from "gql";
import "rxjs/add/operator/map";

@Widget({
  fqelement: "Profile",
  ng2_providers: [ GraphQlService ]
})
export class EditProfileEmailComponent {
  @Field("Profile") profile: ProfileAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  edit_email_error = false;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.profile.atom_id) {
      this.fetch();
    }

    this.submit_ok.on_change(() => {
      // reset error
      this.edit_email_error = false;
      if (this.profile.atom_id && this.profile.email) {
        this._graphQlService
          .post(`
            updateProfile(
              username: "${this.profile.atom_id}",
              email: "${this.profile.email}")
          `)
          .subscribe(success => {
            this.edit_email_error = !success;
            this.profile.email = "";
          });
      }
    });
  }

  private fetch() {
    this._graphQlService
      .get(`
        profile_by_id(atom_id: "${this.profile.atom_id}") {
          email
        }
      `)
      .map(data => data.profile_by_id)
      .subscribe(profile => {
        this.profile.email = profile.email;
      });
  }
}
