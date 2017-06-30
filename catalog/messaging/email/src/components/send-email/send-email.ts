import {GraphQlService} from "gql";

import {Widget, Field, Atom, PrimitiveAtom} from "client-bus";


@Widget({
  fqelement: "Email",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class SendEmailComponent {
  @Field("string") to: PrimitiveAtom<string>;
  @Field("Content") content: Atom;

  constructor(private _graphQlService: GraphQlService) {}

  send_email() {
    // Just send the atom ID in the email for now
    // TODO: update to send more informative emails
    this._graphQlService
      .post(`
        sendEmail(to: "${this.to.value}", content: "${this.content.atom_id}")
      `)
      .subscribe(result => undefined);
  }
}
