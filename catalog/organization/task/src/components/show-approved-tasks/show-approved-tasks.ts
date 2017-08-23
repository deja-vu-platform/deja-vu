import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus, Field, Atom, AfterInit} from "client-bus";
import {NamedAtom} from "../shared/data";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowApprovedTasksComponent implements AfterInit {
  @Field("Assignee") assignee: Atom;
  approvedTasks = [];

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
      if (this.assignee.atom_id === undefined) return;

      this._graphQlService
      .get(`
        approvedTasks(assignee_id: "${this.assignee.atom_id}"){
          name
        }
      `)
      .map(data => data.approvedTasks)
      .flatMap((tasks, unused_ix) => Observable.from(tasks))
      .map((task: NamedAtom) => {
        const task_atom = this._clientBus.new_atom<NamedAtom>("Task");
        task_atom.atom_id = task.atom_id;
        task_atom.name = task.name;
        return task_atom;
      })
      .subscribe(task => {
        this.approvedTasks.push(task);
      });
  }
}
