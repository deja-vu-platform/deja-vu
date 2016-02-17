import {Component} from "angular2/core";
import {FriendsComponent} from "../client/components/friends/friends";
import {AddFriendComponent} from "../client/components/add-friend/add-friend";

@Component({
  selector: "friend-pattern",
  template: `
    <h1>Friends(User)</h1>
    <friends username="benbitdiddle">Loading...</friends>
    <h1>AddFriend(User)</h1>
    <add-friend username="benbitdiddle">Loading...</add-friend>
  `,
  directives: [FriendsComponent, AddFriendComponent]
})
export class FriendPatternComponent {
  public title = "Friend Pattern";
}
