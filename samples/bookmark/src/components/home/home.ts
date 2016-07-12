import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {LoggedInComponent} from
"dv-access-auth/lib/components/logged-in/logged-in";
import {CreatePostComponent} from "../create-post/create-post";
import {FeedComponent} from
"dv-messaging-feed/lib/components/feed/feed";

import {ClientBus} from "client-bus";


@Component({
  selector: "home",
  templateUrl: "./components/home/home.html",
  directives: [LoggedInComponent, CreatePostComponent, FeedComponent],
  providers: [ClientBus, HTTP_PROVIDERS]
})
export class HomeComponent {
  username: string;
  user;
  post_user;
  feed_sub = {name: ""};

  constructor(private _client_bus: ClientBus) {}

  loggedInUser(username: string) {
    console.log("got a username");
    this.username = username;
    // tmp hack: auth should be returning an atom obj
    this.user = this._client_bus.new_atom("User");
    this.user.atom_id = username;
    this.user.username = username;
    //

    this.post_user = this.user.adapt({
      name: "User", fqelement: "dv-messaging-post"});
    this.feed_sub = this.user.adapt({
      name: "Subscriber", fqelement: "dv-messaging-feed"});
  }
}
