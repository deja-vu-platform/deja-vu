import {GraphQlService} from "gql";

import {Widget, Field, PrimitiveAtom, AfterInit} from "client-bus";

import {TargetAtom} from "../../shared/data";


@Widget({fqelement: "Scoring", ng2_providers: [GraphQlService]})
export class ShowTotalComponent implements AfterInit {
  @Field("Target") target: TargetAtom;
  @Field("string") aggregateType: PrimitiveAtom<string>;
  total: number;
  private fetched: string;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.fetch();

    this.target.on_change(() => {
      this.fetch();
    });
  }

  private fetch() {
    if (this.isValid() && this.fetched !== this.target.atom_id) {
      this._graphQlService
      .get(`
        target_by_id(
          atom_id: "${this.target.atom_id}") {
          getTotal(
            aggregateType: "${this.aggregateType.value}"
          )
        }
      `)
      .map(data => data.target_by_id.getTotal)
      .subscribe(total => {
        this.total = total;
        this.fetched = this.target.atom_id;
      });
    }
  }

  private isValid() {
    return this.target.atom_id && this.aggregateType.value;
  }
}
