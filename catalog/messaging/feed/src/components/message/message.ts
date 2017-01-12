import {Component} from "@angular/core";

@Component({
  selector: "message",
  template: "{{msg}}",
  inputs: ["msg"]
})
export class MessageComponent {}
