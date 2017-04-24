import {GraphQlService} from "gql";

import {Widget} from "client-bus";

@Widget({fqelement: "Rating", ng2_providers: [GraphQlService]})
export class RateTargetComponent {
  target = { atom_id: undefined, on_change: _ => undefined };
  source = { atom_id: undefined, on_change: _ => undefined };
  rating = { value: 0 };
  radioName = "";

  _rating = 0; // Internal rating value to pass along
  _lastSourceAtomId = null;
  _lastTargetAtomId = null;

  constructor(private _graphQlService: GraphQlService) {
    // This creates a presumably unique name for our radio buttons
    this.radioName = new Date().getTime().toString()
      + Math.floor(Math.random() * 100000).toString();
  }

  /**
   * Sync the rating on the server with the rating on the client.
   *
   * @param newRating Number containing the new rating
   */
  syncRating(newRating) {
    this._rating = newRating;

    this._graphQlService
      .post(`
        updateRating(source: "${this.source.atom_id}",
          target: "${this.target.atom_id}",
          rating: ${this._rating}) {
            rating
          }
      `)
      .subscribe(res => {
        this.rating.value = this._rating;
      });
  }

  /**
   * Load a rating from the server (if any), and set the value of the widget.
   */
  loadRating() {
    // Only make a change if one of the atom IDs changed
    if (this.source.atom_id === this._lastSourceAtomId
      && this.target.atom_id === this._lastTargetAtomId) {
        return;
      }
    this._lastSourceAtomId = this.source.atom_id;
    this._lastTargetAtomId = this.target.atom_id;

    this._graphQlService
      .get(`
        ratingBySourceTarget(source: "${this.source.atom_id}",
          target: "${this.target.atom_id}") {
            rating
          }
      `)
      .subscribe(res => {
        // If a rating already exists, then we pre-populate the value
        if (res.ratingBySourceTarget) {
          this._rating = res.ratingBySourceTarget.rating;
          this.rating.value = this._rating;
        }
      });
  }

  dvAfterInit() {
    this.loadRating();
    this.target.on_change(this.loadRating.bind(this));
    this.source.on_change(this.loadRating.bind(this));
  }
}
