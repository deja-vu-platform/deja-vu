import {Component} from "@angular/core";

// tmp hack
@Component({
  selector: "publisher",
  template: `{{pub.name}}`,
  inputs: ["pub"]
})
export class UserComponent {}
