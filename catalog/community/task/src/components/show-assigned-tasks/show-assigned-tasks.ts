import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus} from "client-bus";
import {Task} from "../../shared/data";

import * as _u from "underscore";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowAssignedTasksComponent {
  assigner = {atom_id: undefined, on_change: _ => undefined};
  assignedTasks = [];
  fields = {};

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
      if (this.assigner.atom_id === undefined) return;

      this._graphQlService
      .get(`
        assignedTasks(assigner_id: "${this.assigner.atom_id}"){
          name
        }
      `)
       .map(data => data.assignedTasks)
      .flatMap((tasks, unused_ix) => Observable.from(tasks))
      .map((task: Task) => {
        const task_atom = this._clientBus.new_atom("Task");
        task_atom.atom_id = task.atom_id;
        task_atom.name = task.name;
        return {task: task_atom};
      })
      .map(task => _u.extend(task, this.fields))
      .subscribe(task => {
        this.assignedTasks.push(task);
      });
  }
}
