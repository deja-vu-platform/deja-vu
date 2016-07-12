import {Component, provide} from "angular2/core";

import {LoggedInComponent} from
"dv-access-auth/lib/components/logged-in/logged-in";
import {EditFollowComponent} from
"dv-community-follow/lib/components/edit-follow/edit-follow";

import {LOCS} from "../../dv-dev/locs";


@Component({
  selector: "users",
  templateUrl: "./components/users/users.html",
  providers: [provide("follow.api", {useValue: LOCS["dv-community-follow-1"]})],
  directives: [LoggedInComponent, EditFollowComponent]
})
export class UsersComponent {
  username: string;

  loggedInUser(username: string) {
    console.log("got username <" + username + ">");
    this.username = username;
  }
}
