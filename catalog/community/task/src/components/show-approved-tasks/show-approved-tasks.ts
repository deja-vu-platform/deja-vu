import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus} from "client-bus";
import {Task} from "../../shared/data";

import * as _u from "underscore";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowApprovedTasksComponent {
  assignee = {atom_id: undefined, on_change: _ => undefined};
  approvedTasks = [];
  fields = {};

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
      .map((task: Task) => {
        const task_atom = this._clientBus.new_atom("Task");
        task_atom.atom_id = task.atom_id;
        task_atom.name = task.name;
        return {task: task_atom};
      })
      .map(task => _u.extend(task, this.fields))
      .subscribe(task => {
        this.approvedTasks.push(task);
      });
  }
}
