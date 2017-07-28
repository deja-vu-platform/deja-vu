import "rxjs/add/operator/toPromise";

import {GraphQlService} from "gql";

import {Widget, Field, Atom, AfterInit, ClientBus} from "client-bus";

import {RatingAtom} from "../../shared/data";


@Widget({fqelement: "Rating", ng2_providers: [GraphQlService]})
export class ShowRatingComponent implements AfterInit {
  @Field("Target") target: Atom;
  @Field("Source") source: Atom;
  @Field("Rating") rating: RatingAtom;

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  loadRatingBySourceTarget() {
    return this._graphQlService
      .get(`
        ratingBySourceTarget(
          source_id: "${this.source.atom_id}",
          target_id: "${this.target.atom_id}"
        ) {
          atom_id,
          rating
        }
      `)
      .toPromise()
      .then(res => {
        if (res.ratingBySourceTarget) {
          this.rating.atom_id = res.ratingBySourceTarget.atom_id;
          this.rating.rating = res.ratingBySourceTarget.rating;
          this.rating.source = this.source;
          this.rating.target = this.target;
        }
      });
  }

  loadRatingById() {
    return this._graphQlService
      .get(`
        rating_by_id(atom_id: "${this.source.atom_id}") {
          atom_id,
          rating,
          source {
            atom_id
          },
          target {
            atom_id
          }
        }
      `)
      .toPromise()
      .then(res => {
        if (res.rating_by_id) {
          this.rating.atom_id = res.rating_by_id.atom_id;
          this.rating.rating = res.rating_by_id.rating;
          const source_atom = this._clientBus.new_atom<Atom>("Source");
          source_atom.atom_id = res.rating_by_id.source.atom_id;
          this.rating.source = source_atom;
          const target_atom = this._clientBus.new_atom<Atom>("Target");
          target_atom.atom_id = res.rating_by_id.target.atom_id;
          this.rating.target = target_atom;
        }
      });
  }

  dvAfterInit() {
    if (!this.rating.rating) {
      if (this.rating.atom_id) {
        this.loadRatingById();
      } else if (this.source.atom_id && this.target.atom_id) {
        this.loadRatingBySourceTarget();
      }
    }
  }
}
