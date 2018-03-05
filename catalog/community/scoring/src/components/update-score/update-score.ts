import {GraphQlService} from "gql";

import {Widget, Field, PrimitiveAtom, AfterInit} from "client-bus";

import {ScoreAtom, TargetAtom} from "../../shared/data";


@Widget({fqelement: "Scoring", ng2_providers: [GraphQlService]})
export class UpdateScoreComponent implements AfterInit {
  @Field("Target") target: TargetAtom;
  @Field("Score") score: ScoreAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      if (this.isValid()) {
        this._graphQlService
        .get(`
          target_by_id(
            atom_id: "${this.target.atom_id}") {
            updateScore(
              name: "${this.score.name}",
              score: ${this.score.score}
            )
          }
        `)
        .subscribe(_ => undefined);
      }
    });
  }

  private isValid() {
    return this.target.atom_id && this.score.name
      && (this.score.score || this.score.score === 0);
  }
}
