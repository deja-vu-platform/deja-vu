import {GraphQlService} from "gql";

import {Widget, Field, PrimitiveAtom} from "client-bus";
import {ItemAtom, ChecklistAtom} from "../shared/data";


@Widget({fqelement: "Checklist", ng2_providers: [GraphQlService]})
export class AddItemComponent {
  @Field("Item") item: ItemAtom;
  @Field("Checklist") checklist: ChecklistAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    if (!this.checklist.atom_id) return;

    this._graphQlService
      .get(`
        checklist_by_id(atom_id: "${this.checklist.atom_id}") {
          addItem(name: "${this.item.name}") {
            atom_id
          }
        }
      `)
      .subscribe(atom_id => {
        this.item.atom_id = atom_id;
        this.submit_ok.value = true;
      });
  }
}
