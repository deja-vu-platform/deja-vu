import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus, Field, Atom, AfterInit} from "client-bus";
import {NamedAtom} from "../shared/data";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowUncompletedTasksComponent implements AfterInit {
  @Field("Assignee") assignee: Atom;
  uncompletedTasks = [];

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {

    if (this.assignee.atom_id === undefined) return;

    this._graphQlService
      .get(`
        uncompletedTasks(assignee_id: "${this.assignee.atom_id}"){
          name,
          atom_id
        }
      `)
      .map(data => data.uncompletedTasks)
      .flatMap((tasks, unused_ix) => Observable.from(tasks))
      .map((task: NamedAtom) => {
        const task_atom = this._clientBus.new_atom<NamedAtom>("Task");
        task_atom.atom_id = task.atom_id;
        task_atom.name = task.name;
        return task_atom;
      })
      .subscribe(task => {
        this.uncompletedTasks.push(task);
      });

  }
}
