import {GraphQlService} from "gql";

import {Widget, PrimitiveAtom, Field} from "client-bus";
import {ProfileAtom} from "../shared/data";


@Widget({fqelement: "Profile", ng2_providers: [GraphQlService]})
export class UpdateProfileComponent {
  @Field("Profile") profile: ProfileAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    this._graphQlService
      .post(`
        updateProfile(
          updatedProfile: "${this.profile}",
        )
      `)
      .subscribe(_ => {
        // trigger the success message
        this.submit_ok.value = true;
      });
  }
}
