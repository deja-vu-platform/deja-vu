import {GraphQlService} from "gql";

import {Widget, Field, AfterInit} from "client-bus";
import {ChecklistAtom} from "../shared/data";


@Widget({fqelement: "Checklist", template: `{{checklist.name}}`})
export class ShowChecklistOverviewComponent implements AfterInit {
  @Field("Checklist") checklist: ChecklistAtom;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    const updateChecklistName = () => {
      return this._graphQlService
        .get(`
          checklist_by_id(atom_id: "${this.checklist.atom_id}") {
            name
          }
        `)
        .map(data => data.checklist_by_id.name)
        .subscribe(name => this.checklist.name = name);
    };
    updateChecklistName();
  }
}
