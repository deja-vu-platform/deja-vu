import {GraphQlService} from "gql";

import {Widget, ClientBus, Field, PrimitiveAtom, WidgetValue} from "client-bus";
import {UserAtom} from "../../shared/data";


@Widget({fqelement: "Chat", ng2_providers: [GraphQlService]})
export class StartChatButtonComponent {
  @Field("User") user1: UserAtom;
  @Field("User") user2: UserAtom;
  @Field("Widget") on_chat_ok: PrimitiveAtom<WidgetValue>;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  chat() {
    if (this.isValid()) {
      this._graphQlService
      .post(`
        startChat(
          users: [${this.user1.atom_id}, ${this.user2.atom_id}]
        )
      `)
      .map(data => data.startChat)
      .subscribe(isNewChat => {
        if (isNewChat) {
          this.submit_ok.value = !this.submit_ok.value;
        }
        if (this.on_chat_ok.value)
          this._clientBus.navigate(this.on_chat_ok.value);
      });
    }
  }

  isValid() {
    return this.user1.atom_id && this.user2.atom_id;
  }
}
