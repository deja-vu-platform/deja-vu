import {Widget, Field} from "client-bus";
import {ProfileAtom} from "../shared/data";
import {GraphQlService} from "gql";
import "rxjs/add/operator/map";

@Widget({fqelement: "Profile", ng2_providers: [GraphQlService]})
export class ShowProfileComponent {
  @Field("Profile") profile: ProfileAtom;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    console.log("showing profile...");
    console.log(this.profile); // has atom_id and username when printed
    console.log("test" + this.profile.atom_id); // but this
    console.log("test2" + this.profile.username); // and this are undefined
    if (this.profile.atom_id) {
      this._graphQlService
        .get(`
          profile_by_id(atom_id: "${this.profile.atom_id}")
          {
            username, first_name, last_name, email, phone, birthday
          }
        `)
        .map(data => data.profile_by_id)
        .subscribe(profile => {
          this.profile.username = profile.username;
          this.profile.first_name = profile.first_name;
          this.profile.last_name = profile.last_name;
          this.profile.email = profile.email;
          this.profile.phone = profile.phone;
          this.profile.birthday = profile.birthday;
          // TODO: format phone and/or birthday?
        });
    }
  }
}
