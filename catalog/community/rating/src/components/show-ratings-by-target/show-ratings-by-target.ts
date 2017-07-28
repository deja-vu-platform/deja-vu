import "rxjs/add/operator/toPromise";

import {GraphQlService} from "gql";

import {Widget, Field, Atom, AfterInit, ClientBus} from "client-bus";

import {RatingAtom} from "../../shared/data";


@Widget({fqelement: "Rating", ng2_providers: [GraphQlService]})
export class ShowRatingsByTargetComponent implements AfterInit {
  @Field("Target") target: Atom;
  ratings: RatingAtom[] = [];

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  loadRatings() {
    return this._graphQlService
      .get(`
        ratingsByTarget(target_id: "${this.target.atom_id}") {
          rating,
          source {
            atom_id
          }
        }
      `)
      .toPromise()
      .then(res => {
        res.ratingsByTarget.forEach(res_elm => {
          const source_atom = this._clientBus.new_atom<Atom>("Source");
          source_atom.atom_id = res_elm.source.atom_id;
          const rating_atom = this._clientBus.new_atom<RatingAtom>("Rating");
          rating_atom.target = this.target;
          rating_atom.source = source_atom;
          rating_atom.rating = res_elm.rating;
          this.ratings.push(rating_atom);
        });
      });
  }

  dvAfterInit() {
    this.loadRatings();
  }
}
