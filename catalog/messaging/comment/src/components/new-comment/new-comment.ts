import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({fqelement: "Comment", ng2_providers: [GraphQlService]})
export class NewCommentComponent {
  author = {name: "", atom_id: ""};
  comment = {atom_id: "", content: ""};
  target = {name: "", atom_id: ""};
  submit_ok = {value: false};

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    this._graphQlService
      .get(`
        target_by_id(atom_id: "${this.target.atom_id}") {
          newComment(
            author: "${this.author.name}",
            content: "${this.comment.content}") {
              atom_id
            }
        }
      `)
      .subscribe(atom_id => {
        this.comment.atom_id = atom_id;
        this.submit_ok.value = true;
      });
  }
}
