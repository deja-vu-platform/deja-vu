import { GraphQlService } from "gql";

import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import { Widget, ClientBus, Field, Atom, AfterInit } from "client-bus";
import { NamedAtom } from "../shared/data";

@Widget({ fqelement: "Task", ng2_providers: [GraphQlService] })
export class ShowAssignedTasksComponent implements AfterInit {
  @Field("Assigner") assigner: Atom;

  assignedTasks = [];
  private fetched: string;

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) { }

  dvAfterInit() {
    if (this.assigner.atom_id) {
      this.fetch();
    }
    this.assigner.on_change(() => this.fetch());
  }

  private fetch() {
    if (this.fetched !== this.assigner.atom_id) {
      this.fetched = this.assigner.atom_id;
      if (this.assigner.atom_id) {
        this._graphQlService
          .get(`
          assignedTasks(assigner_id: "${this.assigner.atom_id}"){
            name
          }
        `)
          .map(data => data.assignedTasks)
          .flatMap((tasks, unused_ix) => Observable.from(tasks))
          .map((task: NamedAtom) => {
            const task_atom = this._clientBus.new_atom<NamedAtom>("Task");
            task_atom.atom_id = task.atom_id;
            task_atom.name = task.name;
            return task;
          })
          .subscribe(task => {
            this.assignedTasks.push(task);
          });
      }
    }
  }
}
