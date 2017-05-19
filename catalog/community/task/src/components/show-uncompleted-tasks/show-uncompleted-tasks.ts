import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus} from "client-bus";
import {Task} from "../../shared/data";

import * as _u from "underscore";



@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowUncompletedTasksComponent {
  assignee = {atom_id: undefined, on_change: _ => undefined};
  uncompletedTasks = [];
  fields = {};

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {

    console.log ("dv after init");

    const update_tasks = () => {
      console.log("updating");
      console.log(this.assignee);
      if (this.assignee.atom_id === undefined) return;
      console.log("updating");

      return this._graphQlService
      .get(`
        uncompletedTasks(assignee_id: "${this.assignee.atom_id}"){
          name,
          atom_id
        }
      `)
      .map(data => data.uncompletedTasks)
      .flatMap((tasks, unused_ix) => Observable.from(tasks))
      .map((task: Task) => {
        const task_atom = this._clientBus.new_atom("Task");
        task_atom.atom_id = task.atom_id;
        task_atom.name = task.name;
        return {task: task_atom};
      })
      .map(task => _u.extend(task, this.fields))
      .subscribe(task => {
        this.uncompletedTasks.push(task);
      });
    };

    update_tasks();
    this.assignee.on_change(update_tasks);
  }

  markCompleted(task) {
    this._graphQlService
      .post(`
        completeTask(task_id: "${task.atom_id}")
      `)
      .subscribe(res => undefined);
  }
}
