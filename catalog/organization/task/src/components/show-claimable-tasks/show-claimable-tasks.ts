import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus, Field, Atom, AfterInit} from "client-bus";
import {NamedAtom} from "../shared/data";


@Widget({fqelement: "Task", ng2_providers: [GraphQlService]})
export class ShowClaimableTasksComponent implements AfterInit {
  @Field("Assigner") assigner: Atom;
  claimableTasks = [];

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    console.log("showing claimable tasks...");
    console.log(this.assigner); // has atom_id when printed
    console.log(this.assigner.atom_id); // but this is undefined
    if (this.assigner.atom_id === undefined) return;

    this._graphQlService
    .get(`
      claimableTasks(assigner_id: "${this.assigner.atom_id}"){
        name
      }
    `)
    .map(data => data.claimableTasks)
    .flatMap((tasks, unused_ix) => Observable.from(tasks))
    .map((task: NamedAtom) => {
      const task_atom = this._clientBus.new_atom<NamedAtom>("Task");
      task_atom.atom_id = task.atom_id;
      task_atom.name = task.name;
      return task;
    })
    .subscribe(task => {
      this.claimableTasks.push(task);
    });
  }
}
