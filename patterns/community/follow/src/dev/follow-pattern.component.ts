import {Component} from "angular2/core";
import {FollowComponent} from "../components/follow/follow";

@Component({
  selector: "follow-pattern",
  template: `
    <h1>Follow(User)</h1>
    <follow username="benbitdiddle">Loading...</follow>
  `,
  directives: [FollowComponent]
})
export class FollowPatternComponent {
  public title = "Follow Pattern";
}
