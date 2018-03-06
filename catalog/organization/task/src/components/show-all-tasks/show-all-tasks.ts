import { GraphQlService } from "gql";

import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import { Widget, ClientBus, Field, Atom, AfterInit } from "client-bus";
import { TaskAtom } from "../shared/data";


@Widget({ fqelement: "Task", ng2_providers: [GraphQlService] })
export class ShowAllTasksComponent implements AfterInit {
    @Field("Assignee") assignee: Atom;
    allTasks = [];

    private fetched: string;

    constructor(
        private _graphQlService: GraphQlService,
        private _clientBus: ClientBus) { }

    dvAfterInit() {
        if (this.assignee.atom_id) {
            this.fetch();
        }

        this.assignee.on_change(() => this.fetch());
    }

    private fetch() {
        if (this.fetched !== this.assignee.atom_id) {
            this.fetched = this.assignee.atom_id;
            this._graphQlService
                .get(`
                    allTasks(assignee_id: "${this.assignee.atom_id}"){
                        name,
                        atom_id,
                        assigner{atom_id},
                        expiration_date
                    }
                `)
                .map(data => data.allTasks)
                .flatMap((tasks, unused_ix) => Observable.from(tasks))
                .map((task: TaskAtom) => {
                    const task_atom =
                        this._clientBus.new_atom<TaskAtom>("Task");
                    task_atom.atom_id = task.atom_id;
                    task_atom.name = task.name;
                    task_atom.assigner =
                        this._clientBus.new_atom<Atom>("Assigner");
                    task_atom.assigner.atom_id = task.assigner.atom_id;
                    task_atom.assignee = this.assignee;
                    task_atom.expiration_date = task.expiration_date;
                    return task_atom;
                })
                .subscribe(task => {
                    this.allTasks.push(task);
                });
        }
    }
}
