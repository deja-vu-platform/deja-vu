import {Component} from "angular2/core";
import {SearchComponent} from "../components/search/search";
import {LabelComponent} from "../components/label/label";

@Component({
  selector: "dev",
  template: `
    <h1>Search() -> [Item]</h1>
    <search>Loading...</search>
    <h1>Label() -> [Label]</h1>
    <label>Loading...</label>
  `,
  directives: [SearchComponent, LabelComponent]
})
export class DevComponent {
  public title = "Label Pattern";
}
