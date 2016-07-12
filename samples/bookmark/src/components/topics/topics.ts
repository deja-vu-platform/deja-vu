import {Component, provide} from "angular2/core";

import {LoggedInComponent} from
"dv-access-auth/lib/components/logged-in/logged-in";
import {EditFollowComponent} from
"dv-community-follow/lib/components/edit-follow/edit-follow";

import {LOCS} from "../../dv-dev/locs";


@Component({
  selector: "topics",
  templateUrl: "./components/topics/topics.html",
  providers: [provide("follow.api", {useValue: LOCS["dv-community-follow-2"]})],
  directives: [LoggedInComponent, EditFollowComponent]
})
export class TopicsComponent {
  username: string;

  loggedInUser(username: string) {
    console.log("got username <" + username + ">");
    this.username = username;
  }
}
