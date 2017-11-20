import {ElementRef} from "@angular/core";
import {Widget, Field, PrimitiveAtom} from "client-bus";
import {ProfileAtom} from "../shared/data";
import {GraphQlService} from "gql";
import "rxjs/add/operator/map";

@Widget({
  fqelement: "Profile",
  ng2_providers: [ GraphQlService ]
})
export class EditProfileFirstNameComponent {
  firstName: Element;
  @Field("Profile") profile: ProfileAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  edit_first_name_error = false;

  constructor(
      private _graphQlService: GraphQlService,
      private _elementRef: ElementRef) {}

  dvAfterInit() {
    this.firstName = document.getElementById("first-name");

    if (this.profile.atom_id) {
      console.log("fetching");
      this.fetch();
    }

    this.submit_ok.on_after_change(() => {
      // reset error
      this.edit_first_name_error = false;
      if (
        this.submit_ok.value &&
        this.profile.atom_id &&
        this.firstName
      ) {
        this._graphQlService
          .post(`
            updateProfile(
              username: "${this.profile.atom_id}",
              first_name: "${this.firstName}")
          `)
          .subscribe(success => {
            this.edit_first_name_error = !success;
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
        this.profile.first_name = profile.first_name;
      });
  }
}
