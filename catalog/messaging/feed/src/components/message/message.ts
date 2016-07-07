import {Component} from "angular2/core";

@Component({
  selector: "message",
  template: "{{msg}}",
  inputs: ["msg"]
})
export class MessageComponent {}
