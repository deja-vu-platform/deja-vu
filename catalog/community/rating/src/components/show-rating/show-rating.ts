import "rxjs/add/operator/toPromise";

import {GraphQlService} from "gql";

import {Widget, Field, Atom, AfterInit} from "client-bus";

@Widget({fqelement: "Rating", ng2_providers: [GraphQlService]})
export class ShowRatingComponent implements AfterInit {
  @Field("Target") target: Atom;
  @Field("Source") source: Atom;
  rating: number;

  constructor(private _graphQlService: GraphQlService) {}

  /**
   * Load a rating from the server (if any), and set the value of the widget.
   */
  loadRating() {
    return this._graphQlService
      .get(`
        ratingBySourceTarget(source: "${this.source.atom_id}",
          target: "${this.target.atom_id}") {
            rating
          }
      `)
      .toPromise()
      .then(res => {
        if (res.ratingBySourceTarget) {
          this.rating = res.ratingBySourceTarget.rating;
        }
      });
  }

  dvAfterInit() {
    this.loadRating();
  }
}
