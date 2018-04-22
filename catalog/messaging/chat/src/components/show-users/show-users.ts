import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/map";

import {
  Widget, WidgetValue, ClientBus, Field, PrimitiveAtom, AfterInit
} from "client-bus";
import {UserAtom} from "../../shared/data";


@Widget({fqelement: "Chat", ng2_providers: [GraphQlService]})
export class ShowUsersComponent implements AfterInit {
  @Field("User") user: UserAtom;
  @Field("Widget") on_chat_ok: PrimitiveAtom<WidgetValue>;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;
  users: UserAtom[];

  private fetched: string;

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    if (this.user.atom_id) {
      this.fetch();
    }

    this.user.on_change(() => this.fetch());
  }

  private fetch() {
    if (this.user.atom_id && this.fetched !== this.user.atom_id) {
      this.users = [];
      this.fetched = this.user.atom_id;
      this._graphQlService
      .get(`
        user_all {
          atom_id, username
        }
      `)
      .map(data => data.user_all)
      .flatMap((users, unused_ix) => Observable.from(users))
      .map((user: UserAtom) => {
        if (this.user.atom_id && user.atom_id !== this.user.atom_id) {
          const user_atom = this._clientBus.new_atom<UserAtom>("User");
          user_atom.atom_id = user.atom_id;
          user_atom.username = user.username;
          return user_atom;
        }
      })
      .subscribe(user => {
        this.users.push(user);
      });
    }
  }
}
