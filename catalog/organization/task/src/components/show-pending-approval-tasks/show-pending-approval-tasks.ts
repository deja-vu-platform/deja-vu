import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus, Field, Atom, AfterInit} from "client-bus";
import {NamedAtom} from "../shared/data";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowPendingApprovalTasksComponent implements AfterInit {
  @Field("Assigner") assigner: Atom;
  pendingApprovalTasks = [];

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}


  dvAfterInit() {
      if (this.assigner.atom_id === undefined) return;

      this._graphQlService
      .get(`
        pendingApprovalTasks(assigner_id: "${this.assigner.atom_id}"){
          name,
          atom_id
        }
      `)
      .map(data => data.pendingApprovalTasks)
      .flatMap((tasks, unused_ix) => Observable.from(tasks))
      .map((task: NamedAtom) => {
        const task_atom = this._clientBus.new_atom<NamedAtom>("Task");
        task_atom.atom_id = task.atom_id;
        task_atom.name = task.name;
        return task_atom;
      })
      .subscribe(task => {
        this.pendingApprovalTasks.push(task);
      });
  }
}
