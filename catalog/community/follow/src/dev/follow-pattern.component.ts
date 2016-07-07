import {Component} from "angular2/core";
import {FollowComponent} from "../components/follow/follow";
import {EditFollowComponent} from "../components/edit-follow/edit-follow";

@Component({
  selector: "follow-pattern",
  template: `
    <h1>Follow(User)</h1>
    <follow name="benbitdiddle">Loading...</follow>
    <h1>EditFollow(User)</h1>
    <edit-follow name="benbitdiddle">Loading...</edit-follow>
  `,
  directives: [FollowComponent, EditFollowComponent]
})
export class FollowPatternComponent {
  public title = "Follow Pattern";
}
