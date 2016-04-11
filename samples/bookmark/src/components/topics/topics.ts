import {Component} from "angular2/core";

import {LoggedInComponent} from
"dv-access-auth/lib/components/logged-in/logged-in";
import {EditFollowComponent} from
"dv-community-follow/lib/components/edit-follow/edit-follow";


@Component({
  selector: "topics",
  templateUrl: "./components/topics/topics.html",
  directives: [LoggedInComponent, EditFollowComponent]
})
export class TopicsComponent {
  username: string;

  loggedInUser(username: string) {
    console.log("got username <" + username + ">");
    this.username = username;
  }
}
