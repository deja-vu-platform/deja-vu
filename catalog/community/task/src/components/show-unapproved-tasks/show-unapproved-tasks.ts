import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus} from "client-bus";
import {Task} from "../../shared/data";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowUnapprovedTasksComponent {
  assignee = {atom_id: undefined, on_change: _ => undefined};
  unapprovedTasks = [];

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
      if (this.assignee.atom_id === undefined) return;

      this._graphQlService
      .get(`
        unapprovedTasks(assignee_id: "${this.assignee.atom_id}"){
          name
        }
      `)
      .map(data => data.unapprovedTasks)
      .flatMap((tasks, unused_ix) => Observable.from(tasks))
      .map((task: Task) => {
        const task_atom = this._clientBus.new_atom("Task");
        task_atom.atom_id = task.atom_id;
        task_atom.name = task.name;
        return task_atom;
      })
      .subscribe(task => {
        this.unapprovedTasks.push(task);
      });

  }
}
