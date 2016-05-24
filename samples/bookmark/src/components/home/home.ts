import {Component} from "angular2/core";

import {LoggedInComponent} from
"dv-access-auth/lib/components/logged-in/logged-in";
import {CreatePostComponent} from "../create-post/create-post";
import {FeedComponent} from
"dv-messaging-feed/lib/components/feed/feed";


@Component({
  selector: "home",
  templateUrl: "./components/home/home.html",
  directives: [LoggedInComponent, CreatePostComponent, FeedComponent]
})
export class HomeComponent {
  username: string;
  user;

  loggedInUser(username: string) {
    console.log("got a username");
    this.username = username;
    // tmp hack: set atom_id
    this.user = {atom_id: username, username: username};
  }
}
