import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-messaging-email",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class SendEmailComponent {
  to = {value: ""};
  content = {atom_id: ""};

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
