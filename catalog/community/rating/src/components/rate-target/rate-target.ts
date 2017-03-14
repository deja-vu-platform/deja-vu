import {GraphQlService} from "gql";

import {Widget} from "client-bus";

@Widget({
  fqelement: "dv-community-rating",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class RateTargetComponent {
  target = {atom_id: ""};
  source = {atom_id: ""};
  rating = {value: 0, on_change: _ => undefined};
  radioName = "";

  constructor(private _graphQlService: GraphQlService) {
    // This creates a presumably unique name for our radio buttons
    this.radioName = new Date().getTime().toString()
      + Math.floor(Math.random() * 100000).toString();
  }

  syncRating() {
    this._graphQlService
      .post(`
        updateRating(source: "${this.source.atom_id}",
          target: "${this.target.atom_id}",
          rating: ${this.rating.value})
      `)
      .subscribe(res => {
        console.log(res);
      });
  }

  dvAfterInit() {
    console.log("hi rating is", this.rating, this.rating.value);
    this.rating.on_change(this.syncRating);
  }
}
