import {Component} from "angular2/core";

// tmp hack
@Component({
  selector: "message",
  template: `{{msg.content}}`,
  inputs: ["msg"]
})
export class PostComponent {}
