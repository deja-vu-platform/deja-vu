import {Component} from "angular2/core";

import {AddFriendComponent} from
"dv-community-friend/lib/components/add-friend/add-friend";

@Component({
  selector: "find-friends",
  templateUrl: "./components/find-friends/find-friends.html",
  directives: [AddFriendComponent]
})
export class FindFriendsComponent {
}
