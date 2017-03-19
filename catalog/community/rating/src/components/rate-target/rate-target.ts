import {GraphQlService} from "gql";

import {Widget} from "client-bus";

@Widget({
  fqelement: "dv-community-rating",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class RateTargetComponent {
  target = {atom_id: "1"};
  source = {atom_id: "1"};
  rating = {value: 0};
  radioName = "";

  _rating: 0; // Internal rating value to pass along

  constructor(private _graphQlService: GraphQlService) {
    // This creates a presumably unique name for our radio buttons
    this.radioName = new Date().getTime().toString()
      + Math.floor(Math.random() * 100000).toString();
  }

  syncRating(newRating) {
    this._rating = newRating;

    console.log("We invoked syncRating! :)");
    this._graphQlService
      .post(`
        updateRating(source: "${this.source.atom_id}",
          target: "${this.target.atom_id}",
          rating: ${this._rating})
      `)
      .subscribe(res => {
        console.log(res);
        this.rating.value = this._rating;
      });
  }

  dvAfterInit() {
    console.log("hi rating is", this.rating, this.rating.value);
    // this.rating.on_change(this.syncRating);
  }
}
