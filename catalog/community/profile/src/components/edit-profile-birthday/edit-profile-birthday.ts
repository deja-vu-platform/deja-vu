import {Widget, Field, PrimitiveAtom} from "client-bus";
import {ProfileAtom} from "../shared/data";
import {GraphQlService} from "gql";
import "rxjs/add/operator/map";

@Widget({
  fqelement: "Profile",
  ng2_providers: [ GraphQlService ]
})
export class EditProfileBirthdayComponent {
  @Field("Profile") profile: ProfileAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  edit_birthday_error = false;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.profile.atom_id) {
      this.fetch();
    }

    this.submit_ok.on_change(() => {
      // reset error
      this.edit_birthday_error = false;
      if (
        this.submit_ok.value &&
        this.profile.atom_id &&
        this.profile.birthday
      ) {
        this._graphQlService
          .post(`
            updateProfile(
              username: "${this.profile.atom_id}",
              birthday: "${this.profile.birthday}")
          `)
          .subscribe(success => {
            this.edit_birthday_error = !success;
          });
      }
    });
  }

  private fetch() {
    this._graphQlService
      .get(`
        profile_by_id(atom_id: "${this.profile.atom_id}")
      `)
      .map(data => data.profile_by_id)
      .subscribe(profile => {
        this.profile.birthday = profile.birthday;
        // TODO: format birthday?
      });
  }
}
