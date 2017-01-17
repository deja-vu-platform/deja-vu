import {Output, EventEmitter} from "@angular/core";

import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-label",
  ng2_providers: [GraphQlService]
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
      items(query: "${query}") {
        name
      }
    }`).map(data => data.items);
  }
}
