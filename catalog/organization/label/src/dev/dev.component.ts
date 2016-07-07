import {Component} from "angular2/core";
import {SearchComponent} from "../components/search/search";
import {LabelsTextComponent} from "../components/labels-text/labels-text";

@Component({
  selector: "dev",
  template: `
    <h1>Search() -> [Item]</h1>
    <search>Loading...</search>
    <h1>LabelsText() -> [Label]</h1>
    <labels-text>Loading...</labels-text>
  `,
  directives: [SearchComponent, LabelsTextComponent]
})
export class DevComponent {
  public title = "Label Pattern";
}
