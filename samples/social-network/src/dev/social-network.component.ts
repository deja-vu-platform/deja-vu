import {Component} from "angular2/core";

import {HomeComponent} from "../components/home/home";


@Component({
  selector: "social-network",
  template: `<home></home>`,
  directives: [HomeComponent]
})
export class SocialNetworkComponent {
  public title = "Social Network";
}
