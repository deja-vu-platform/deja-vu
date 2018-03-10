import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GoodAtom} from "../../shared/data";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService],
  template: ``
})
export class EditGoodNameComponent {
  @Field("Good") good: GoodAtom;
  @Field("string") name: PrimitiveAtom<string>;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.good.atom_id) {
      this.fetch();
    }

    this.submit_ok.on_change(() => {
      if (this.name) {
        this._graphQlService
        .get(`
          good_by_id(atom_id: "${this.good.atom_id}") {
            updateGood(
              name: "${this.name.value}"
            )
          }
        `)
        .subscribe(_ => undefined);
      }
    });
  }

  private fetch() {
    this._graphQlService
      .get(`
        good_by_id(atom_id: "${this.good.atom_id}") {
          name
        }
      `)
    .map(data => data.good_by_id)
    .subscribe(good => {
      if (good.name)
        this.name.value = good.name;
    });
  }
}
