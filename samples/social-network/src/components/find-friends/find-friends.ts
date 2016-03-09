import {Component} from "angular2/core";

import {LoggedInComponent} from
"dv-access-auth/lib/components/logged-in/logged-in";
import {AddFriendComponent} from
"dv-community-friend/lib/components/add-friend/add-friend";


@Component({
  selector: "find-friends",
  templateUrl: "./components/find-friends/find-friends.html",
  directives: [LoggedInComponent, AddFriendComponent]
})
export class FindFriendsComponent {
  username: string;

  loggedInUser(username: string) {
    console.log("got username <" + username + ">");
    this.username = username;
  }
}
