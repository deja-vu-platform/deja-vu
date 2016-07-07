import {Component} from "angular2/core";

// tmp hack
@Component({
  selector: "publisher",
  template: `{{pub.name}}`,
  inputs: ["pub"]
})
export class UserComponent {}
