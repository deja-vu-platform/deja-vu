import {GraphQlService} from "gql";

import {Widget, Field, Atom, AfterInit} from "client-bus";


@Widget({
  fqelement: "Rating",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class ShowRatingsComponent implements AfterInit {
  @Field("Target") target: Atom;
  average = 0;
  ratingCount = 0;

  constructor(private _graphQlService: GraphQlService) {}

  /**
   * Download ratings for the target from the server.
   */
  loadRatingAverage() {
    // We want to display rounded ratings to avoid horribly long ones. These
    // parameters are used to configure rounding.
    const BASE = 10;
    const DECIMAL_PLACES = 2;
    const ROUNDING_MULTIPLE = Math.pow(BASE, DECIMAL_PLACES);

    return this._graphQlService
      .get(`
        averageRatingForTarget(target: "${this.target.atom_id}")
      `)
      .toPromise()
      .then(res => res.averageRatingForTarget)
      .then(res => {
        this.average = Math.round(res * ROUNDING_MULTIPLE) / ROUNDING_MULTIPLE;
      });
  }

  /**
   * Download the number of ratings for the target from the server.
   */
  loadRatingCount() {
    return this._graphQlService
      .get(`
        ratingCountForTarget(target: "${this.target.atom_id}")
      `)
      .toPromise()
      .then(res => res.ratingCountForTarget)
      .then(res => {
        this.ratingCount = res;
      });
  }

  dvAfterInit() {
    this.loadRatingAverage();
    this.loadRatingCount();
    this.target.on_change(() => Promise
      .all([this.loadRatingAverage(), this.loadRatingCount()])
      .then(_ => undefined));
  }
}
