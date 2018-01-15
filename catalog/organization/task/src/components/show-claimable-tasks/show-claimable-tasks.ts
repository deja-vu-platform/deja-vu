import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {
  Widget, ClientBus, Field, Atom, PrimitiveAtom, AfterInit
} from "client-bus";
import {Task, TaskAtom} from "../shared/data";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowClaimableTasksComponent implements AfterInit {
  @Field("Assigner") assigner: Atom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;
  claimableTasks: any[];

  private fetched: string;

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    this.claimableTasks = [];
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
          claimableTasks(
            assigner_id: "${this.assigner.atom_id}") {
              atom_id, name, expiration_date, assigner{atom_id}
            }
        `)
        .map(data => data.claimableTasks)
        .flatMap((tasks, unused_ix) => Observable.from(tasks))
        .map((task: Task) => {
          const task_atom = this._clientBus.new_atom<TaskAtom>("Task");
          task_atom.atom_id = task.atom_id;
          task_atom.name = task.name;
          task_atom.expiration_date = task.expiration_date;
          task_atom.assigner = this._clientBus.new_atom<Atom>("Assigner");
          task_atom.assigner.atom_id = task.assigner.atom_id;
          return task_atom;
        })
        .subscribe(task => {
          this.claimableTasks.push(task);
        });
      }
    }
  }
}
