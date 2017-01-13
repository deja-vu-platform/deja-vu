import {Component} from "@angular/core";

// tmp hack
@Component({
  selector: "message",
  template: `{{msg.content}}`,
  inputs: ["msg"]
})
export class PostComponent {}
