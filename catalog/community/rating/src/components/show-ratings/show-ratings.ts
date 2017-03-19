import {GraphQlService} from "gql";

import {Widget} from "client-bus";

@Widget({
  fqelement: "dv-community-rating",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class ShowRatingsComponent {
  target = {atom_id: undefined, on_change: _ => undefined };
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

    this._graphQlService
      .get(`
        averageRatingForTarget(target: "${this.target.atom_id}")
      `)
      .map(res => res.averageRatingForTarget)
      .subscribe(res => {
        this.average = Math.round(res * ROUNDING_MULTIPLE) / ROUNDING_MULTIPLE;
      });
  }

  /**
   * Download the number of ratings for the target from the server.
   */
  loadRatingCount() {
    this._graphQlService
      .get(`
        ratingCountForTarget(target: "${this.target.atom_id}")
      `)
      .map(res => res.ratingCountForTarget)
      .subscribe(res => this.ratingCount = res);
  }

  dvAfterInit() {
    this.loadRatingAverage();
    this.loadRatingCount();
    this.target.on_change(() => {
      this.loadRatingAverage();
      this.loadRatingCount();
    });
  }
}
