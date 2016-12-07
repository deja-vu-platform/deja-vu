import {HTTP_PROVIDERS} from "angular2/http";

import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  ng2_providers: [GraphQlService, HTTP_PROVIDERS],
  styles: [``]
})
export class SendEmailComponent {
  to: string = "";
  content: string = "";

  constructor(private _graphQlService: GraphQlService) {}

  send_email() {
    this._graphQlService
      .post(`
        sendEmail(to: "${this.to}", content: "${this.content}") 
      `)
      .subscribe(result => undefined);
  }
}
