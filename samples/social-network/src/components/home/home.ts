import {Component} from "angular2/core";

import {NewPostComponent} from
"dv-messaging-post/lib/components/new-post/new-post";
import {FeedComponent} from
"dv-messaging-feed/lib/components/feed/feed";

@Component({
  selector: "home",
  templateUrl: "./components/home/home.html",
  directives: [NewPostComponent, FeedComponent]
})
export class HomeComponent {
}
