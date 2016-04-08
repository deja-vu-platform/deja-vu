import {Component, Output, EventEmitter} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";
// import {Observable} from "rxjs/observable";

import {GraphQlService} from "../shared/graphql";


@Component({
  selector: "search",
  templateUrl: "./components/search/search.html",
  providers: [GraphQlService, HTTP_PROVIDERS]
})
export class SearchComponent {
  query: string;
  @Output() matching_items = new EventEmitter();

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    if (!this.query) return;
    console.log("got query " + this.query);
    this._search(this.query).subscribe(
        matching_items => this.matching_items.emit(matching_items));
  }

  private _search(query: string) {
    return this._graphQlService.get(`{
      items(query: "${query}")
    }`).map(data => data.items);
  }
}
