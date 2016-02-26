import {Component} from "angular2/core";

import {LoggedInComponent} from
"dv-access-auth/lib/components/logged-in/logged-in";
import {NewPostComponent} from
"dv-messaging-post/lib/components/new-post/new-post";
import {FeedComponent} from
"dv-messaging-feed/lib/components/feed/feed";


@Component({
  selector: "home",
  templateUrl: "./components/home/home.html",
  directives: [LoggedInComponent, NewPostComponent, FeedComponent]
})
export class HomeComponent {
  username: string;

  loggedInUser(username: string) {
    console.log("got a username");
    this.username = username;
  }
}
