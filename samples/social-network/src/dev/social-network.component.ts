import {Component} from "angular2/core";
// import {SignInComponent} from
// "dv-access-auth/auth/components/sign-in/sign-in";
// import {RegisterComponent} from
// "dv-access-auth/auth/components/register/register";
import {FriendsComponent} from
"dv-community-friend/pack/components/friends/friends";
import {AddFriendComponent} from
"dv-community-friend/pack/components/add-friend/add-friend";

@Component({
  selector: "social-network",
  templateUrl: "./dev/social-network.html",
  directives: [FriendsComponent, AddFriendComponent]
})
export class SocialNetworkComponent {
  public title = "Social Network";
}
