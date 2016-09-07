import {HTTP_PROVIDERS} from "angular2/http";

import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  ng2_providers: [GraphQlService, HTTP_PROVIDERS]
})
export class NewCommentComponent {
  author = {name: ""};
  comment = {atom_id: "", content: ""};
  target = {name: ""};
  submit_ok = {value: false};

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    this._graphQlService
      .get(`
        target(name: "${this.target.name}") {
          newComment(
            author: "${this.author.name}",
            content: "${this.comment.content}") {
            atom_id
        }
      `)
      .subscribe(atom_id => {
        this.comment.atom_id = atom_id;
        this.submit_ok.value = true;
      });
  }
}
