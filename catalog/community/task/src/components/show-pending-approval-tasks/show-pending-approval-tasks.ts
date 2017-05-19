import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus} from "client-bus";
import {Task} from "../../shared/data";

import * as _u from "underscore";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowPendingApprovalTasksComponent {
  assigner = {atom_id: undefined, on_change: _ => undefined};
  pendingApprovalTasks = [];
  fields = {};

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}


  dvAfterInit() {
    const update_tasks = () => {
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
      .map((task: Task) => {
        const task_atom = this._clientBus.new_atom("Task");
        task_atom.atom_id = task.atom_id;
        task_atom.name = task.name;
        return {task: task_atom};
      })
      .map(task => _u.extend(task, this.fields))
      .subscribe(task => {
        this.pendingApprovalTasks.push(task);
      });
    };

    update_tasks();
    this.assigner.on_change(update_tasks);
  }

  markApproved(task) {
    this._graphQlService
      .post(`
        approveTask(task_id: "${task.atom_id}")
      `)
      .subscribe(res => undefined);
  }
}
